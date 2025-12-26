"""
Advanced AI services for resource allocation, burnout detection, and predictions.
"""
from django.utils import timezone
from django.db.models import Avg, Sum, Count, Q
from datetime import timedelta
import statistics


class BurnoutDetectionService:
    """
    AI service for detecting and predicting employee burnout.
    """
    
    RISK_THRESHOLDS = {
        'critical': 75,
        'high': 55,
        'moderate': 35,
        'low': 0
    }
    
    def __init__(self, user):
        self.user = user
    
    def analyze_burnout_risk(self, days=30):
        """
        Analyze burnout risk for a user over the past N days.
        Returns a BurnoutIndicator with risk level and factors.
        """
        from .models import BurnoutIndicator, WorkloadSnapshot
        from analytics.models import TimeEntry
        from tasks.models import Task
        from progress.models import ProgressUpdate
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Gather metrics
        metrics = self._calculate_metrics(start_date, end_date)
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(metrics)
        
        # Determine risk level
        risk_level = self._determine_risk_level(risk_score)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(metrics, risk_level)
        
        # Create or update indicator
        indicator = BurnoutIndicator.objects.create(
            user=self.user,
            risk_level=risk_level,
            risk_score=risk_score,
            factors=metrics,
            avg_hours_per_week=metrics.get('avg_hours_per_week', 0),
            consecutive_overtime_weeks=metrics.get('consecutive_overtime_weeks', 0),
            tasks_overdue=metrics.get('overdue_tasks', 0),
            no_break_days=metrics.get('no_break_days', 0),
            meeting_hours=metrics.get('total_meeting_hours', 0),
            progress_update_sentiment=metrics.get('avg_sentiment', 0),
            recommendations=recommendations
        )
        
        # Notify manager if high risk
        if risk_level in ['high', 'critical'] and not indicator.manager_notified:
            self._notify_manager(indicator)
        
        return indicator
    
    def _calculate_metrics(self, start_date, end_date):
        """Calculate all metrics for burnout analysis."""
        from analytics.models import TimeEntry
        from tasks.models import Task
        from progress.models import ProgressUpdate
        
        metrics = {}
        
        # Time entries
        time_entries = TimeEntry.objects.filter(
            user=self.user,
            start_time__date__gte=start_date,
            start_time__date__lte=end_date
        )
        
        total_hours = time_entries.aggregate(
            total=Sum('duration_minutes')
        )['total'] or 0
        total_hours = total_hours / 60
        
        weeks = (end_date - start_date).days / 7
        avg_hours_per_week = total_hours / max(1, weeks)
        
        metrics['total_hours'] = total_hours
        metrics['avg_hours_per_week'] = avg_hours_per_week
        
        # Calculate overtime weeks
        overtime_weeks = 0
        consecutive_overtime = 0
        max_consecutive = 0
        
        current_date = start_date
        while current_date < end_date:
            week_end = current_date + timedelta(days=7)
            week_hours = time_entries.filter(
                start_time__date__gte=current_date,
                start_time__date__lt=week_end
            ).aggregate(total=Sum('duration_minutes'))['total'] or 0
            week_hours = week_hours / 60
            
            if week_hours > 45:  # Overtime threshold
                overtime_weeks += 1
                consecutive_overtime += 1
                max_consecutive = max(max_consecutive, consecutive_overtime)
            else:
                consecutive_overtime = 0
            
            current_date = week_end
        
        metrics['overtime_weeks'] = overtime_weeks
        metrics['consecutive_overtime_weeks'] = max_consecutive
        
        # Days without breaks
        work_days = time_entries.values('start_time__date').annotate(
            hours=Sum('duration_minutes')
        ).filter(hours__gt=480)  # > 8 hours
        
        no_break_days = work_days.count()
        metrics['no_break_days'] = no_break_days
        
        # Task metrics
        tasks = Task.objects.filter(assigned_to=self.user)
        
        active_tasks = tasks.filter(status__in=['open', 'in_progress']).count()
        overdue_tasks = tasks.filter(
            deadline__lt=timezone.now(),
            status__in=['open', 'in_progress', 'blocked']
        ).count()
        blocked_tasks = tasks.filter(status='blocked').count()
        
        metrics['active_tasks'] = active_tasks
        metrics['overdue_tasks'] = overdue_tasks
        metrics['blocked_tasks'] = blocked_tasks
        
        # Progress update frequency
        updates = ProgressUpdate.objects.filter(
            user=self.user,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        metrics['progress_updates'] = updates.count()
        
        # Sentiment analysis (simplified)
        avg_sentiment = self._analyze_sentiment(updates)
        metrics['avg_sentiment'] = avg_sentiment
        
        # Meeting hours (if calendar events exist)
        from .models import CalendarEvent
        meetings = CalendarEvent.objects.filter(
            user=self.user,
            event_type='meeting',
            start_time__date__gte=start_date,
            start_time__date__lte=end_date
        )
        meeting_minutes = 0
        for meeting in meetings:
            if meeting.end_time:
                delta = meeting.end_time - meeting.start_time
                meeting_minutes += delta.total_seconds() / 60
        
        metrics['total_meeting_hours'] = meeting_minutes / 60
        
        return metrics
    
    def _analyze_sentiment(self, updates):
        """
        Simple sentiment analysis on progress updates.
        Returns score from -1 (negative) to 1 (positive).
        """
        if not updates.exists():
            return 0.0
        
        positive_words = [
            'completed', 'done', 'finished', 'great', 'good', 'excellent',
            'progress', 'achieved', 'success', 'ahead', 'smooth'
        ]
        negative_words = [
            'blocked', 'stuck', 'issue', 'problem', 'delayed', 'difficult',
            'challenge', 'failed', 'behind', 'overdue', 'struggle', 'frustrated'
        ]
        
        total_score = 0
        count = 0
        
        for update in updates:
            text = (update.work_done + ' ' + update.blockers).lower()
            
            positive_count = sum(1 for word in positive_words if word in text)
            negative_count = sum(1 for word in negative_words if word in text)
            
            if positive_count + negative_count > 0:
                score = (positive_count - negative_count) / (positive_count + negative_count)
                total_score += score
                count += 1
        
        return total_score / max(1, count)
    
    def _calculate_risk_score(self, metrics):
        """Calculate overall risk score (0-100)."""
        score = 0
        
        # Overtime factor (max 25 points)
        avg_hours = metrics.get('avg_hours_per_week', 40)
        if avg_hours > 50:
            score += 25
        elif avg_hours > 45:
            score += 15
        elif avg_hours > 40:
            score += 5
        
        # Consecutive overtime (max 20 points)
        consecutive = metrics.get('consecutive_overtime_weeks', 0)
        score += min(20, consecutive * 5)
        
        # No break days (max 15 points)
        no_breaks = metrics.get('no_break_days', 0)
        score += min(15, no_breaks * 2)
        
        # Overdue tasks (max 15 points)
        overdue = metrics.get('overdue_tasks', 0)
        score += min(15, overdue * 3)
        
        # Blocked tasks (max 10 points)
        blocked = metrics.get('blocked_tasks', 0)
        score += min(10, blocked * 2)
        
        # Negative sentiment (max 10 points)
        sentiment = metrics.get('avg_sentiment', 0)
        if sentiment < -0.3:
            score += 10
        elif sentiment < 0:
            score += 5
        
        # Meeting overload (max 5 points)
        meeting_hours = metrics.get('total_meeting_hours', 0)
        if meeting_hours > 20:  # > 20 hours of meetings per period
            score += 5
        
        return min(100, score)
    
    def _determine_risk_level(self, score):
        """Determine risk level from score."""
        if score >= self.RISK_THRESHOLDS['critical']:
            return 'critical'
        elif score >= self.RISK_THRESHOLDS['high']:
            return 'high'
        elif score >= self.RISK_THRESHOLDS['moderate']:
            return 'moderate'
        return 'low'
    
    def _generate_recommendations(self, metrics, risk_level):
        """Generate personalized recommendations."""
        recommendations = []
        
        if metrics.get('avg_hours_per_week', 0) > 45:
            recommendations.append({
                'category': 'workload',
                'title': 'Reduce Working Hours',
                'description': 'Your average weekly hours exceed sustainable levels. Consider delegating tasks or discussing workload with your manager.',
                'priority': 'high'
            })
        
        if metrics.get('consecutive_overtime_weeks', 0) >= 2:
            recommendations.append({
                'category': 'recovery',
                'title': 'Take a Break',
                'description': f"You've had {metrics['consecutive_overtime_weeks']} consecutive overtime weeks. Schedule some time off to recharge.",
                'priority': 'high'
            })
        
        if metrics.get('no_break_days', 0) > 5:
            recommendations.append({
                'category': 'wellness',
                'title': 'Take Regular Breaks',
                'description': 'Ensure you take short breaks throughout the day. Consider the Pomodoro technique.',
                'priority': 'medium'
            })
        
        if metrics.get('overdue_tasks', 0) > 3:
            recommendations.append({
                'category': 'planning',
                'title': 'Review Task Priorities',
                'description': 'You have several overdue tasks. Consider reprioritizing or requesting deadline extensions.',
                'priority': 'high'
            })
        
        if metrics.get('blocked_tasks', 0) > 2:
            recommendations.append({
                'category': 'collaboration',
                'title': 'Resolve Blockers',
                'description': 'Multiple blocked tasks may be causing stress. Schedule time to address blockers or escalate.',
                'priority': 'medium'
            })
        
        if metrics.get('total_meeting_hours', 0) > 15:
            recommendations.append({
                'category': 'focus',
                'title': 'Reduce Meeting Load',
                'description': 'High meeting volume reduces focus time. Consider declining optional meetings or requesting async updates.',
                'priority': 'medium'
            })
        
        if risk_level in ['high', 'critical']:
            recommendations.append({
                'category': 'support',
                'title': 'Speak with Your Manager',
                'description': 'Your burnout risk is elevated. Consider having a conversation with your manager about workload and support.',
                'priority': 'critical'
            })
        
        return recommendations
    
    def _notify_manager(self, indicator):
        """Notify manager about high burnout risk."""
        from users.models import Notification
        
        if not self.user.manager:
            return
        
        Notification.objects.create(
            user=self.user.manager,
            notification_type='reminder',
            title=f'Burnout Risk Alert: {self.user.name}',
            message=f'{self.user.name} has a {indicator.risk_level} burnout risk score. '
                    f'Consider checking in with them about their workload.',
            link=f'/analytics/burnout/{indicator.id}',
            priority='high' if indicator.risk_level == 'critical' else 'normal'
        )
        
        indicator.manager_notified = True
        indicator.manager_notified_at = timezone.now()
        indicator.save()


class ResourceAllocationService:
    """
    AI service for optimal resource allocation and workload distribution.
    """
    
    def __init__(self, company):
        self.company = company
    
    def generate_suggestions(self):
        """Generate resource allocation suggestions."""
        from .models import ResourceAllocationSuggestion
        from tasks.models import Task
        from users.models import User
        
        suggestions = []
        
        # 1. Find overloaded users
        overloaded = self._find_overloaded_users()
        for user, workload in overloaded:
            underloaded = self._find_underloaded_users(exclude=[user])
            if underloaded:
                target_user = underloaded[0][0]
                tasks_to_reassign = self._get_reassignable_tasks(user)
                
                for task in tasks_to_reassign[:2]:  # Suggest max 2 reassignments
                    suggestion = ResourceAllocationSuggestion.objects.create(
                        company=self.company,
                        suggestion_type='reassign',
                        task=task,
                        from_user=user,
                        to_user=target_user,
                        reason=f'{user.name} is overloaded ({workload:.0f}h pending). '
                               f'{target_user.name} has capacity ({underloaded[0][1]:.0f}h pending).',
                        impact_score=self._calculate_reassign_impact(task, user, target_user),
                        confidence_score=0.8,
                        supporting_data={
                            'from_workload': workload,
                            'to_workload': underloaded[0][1],
                            'task_estimated_hours': task.estimated_hours or 0
                        }
                    )
                    suggestions.append(suggestion)
        
        # 2. Find skill gaps
        skill_gaps = self._detect_skill_gaps()
        for gap in skill_gaps:
            suggestion = ResourceAllocationSuggestion.objects.create(
                company=self.company,
                suggestion_type='skill_gap',
                reason=gap['description'],
                impact_score=gap['impact'],
                confidence_score=gap['confidence'],
                supporting_data=gap
            )
            suggestions.append(suggestion)
        
        # 3. Predict overload
        future_overloads = self._predict_future_overload()
        for user, predicted_hours in future_overloads:
            suggestion = ResourceAllocationSuggestion.objects.create(
                company=self.company,
                suggestion_type='overload',
                from_user=user,
                reason=f'{user.name} is predicted to be overloaded next week '
                       f'({predicted_hours:.0f}h estimated vs 40h capacity).',
                impact_score=min(100, (predicted_hours - 40) * 2),
                confidence_score=0.7,
                supporting_data={
                    'predicted_hours': predicted_hours,
                    'capacity': 40
                }
            )
            suggestions.append(suggestion)
        
        return suggestions
    
    def _find_overloaded_users(self, threshold_hours=50):
        """Find users with too much pending work."""
        from tasks.models import Task
        from users.models import User
        
        users = User.objects.filter(company=self.company, is_active=True)
        overloaded = []
        
        for user in users:
            pending_tasks = Task.objects.filter(
                assigned_to=user,
                status__in=['open', 'in_progress']
            )
            
            total_hours = sum(t.estimated_hours or 4 for t in pending_tasks)  # Default 4 hours
            
            if total_hours > threshold_hours:
                overloaded.append((user, total_hours))
        
        return sorted(overloaded, key=lambda x: x[1], reverse=True)
    
    def _find_underloaded_users(self, threshold_hours=20, exclude=None):
        """Find users with capacity for more work."""
        from tasks.models import Task
        from users.models import User
        
        exclude_ids = [u.id for u in (exclude or [])]
        users = User.objects.filter(
            company=self.company,
            is_active=True
        ).exclude(id__in=exclude_ids)
        
        underloaded = []
        
        for user in users:
            pending_tasks = Task.objects.filter(
                assigned_to=user,
                status__in=['open', 'in_progress']
            )
            
            total_hours = sum(t.estimated_hours or 4 for t in pending_tasks)
            
            if total_hours < threshold_hours:
                underloaded.append((user, total_hours))
        
        return sorted(underloaded, key=lambda x: x[1])
    
    def _get_reassignable_tasks(self, user):
        """Get tasks that can be reassigned from user."""
        from tasks.models import Task
        
        # Get tasks that are not yet started and not urgent
        return Task.objects.filter(
            assigned_to=user,
            status='open',  # Not started
            priority__in=['low', 'medium']
        ).order_by('priority', 'deadline')[:5]
    
    def _calculate_reassign_impact(self, task, from_user, to_user):
        """Calculate positive impact of reassignment."""
        impact = 50  # Base impact
        
        # Higher impact for larger tasks
        if task.estimated_hours:
            impact += min(20, task.estimated_hours)
        
        # Higher impact for overdue risk
        if task.deadline:
            days_until = (task.deadline - timezone.now()).days
            if days_until < 3:
                impact += 20
            elif days_until < 7:
                impact += 10
        
        return min(100, impact)
    
    def _detect_skill_gaps(self):
        """Detect skill gaps in the team."""
        from tasks.models import Task
        
        # Simple skill gap detection based on task tags and assignments
        gaps = []
        
        # Find tasks without assignees
        unassigned = Task.objects.filter(
            project__company=self.company,
            assigned_to__isnull=True,
            status='open'
        )
        
        if unassigned.count() > 5:
            gaps.append({
                'type': 'unassigned_tasks',
                'description': f'{unassigned.count()} tasks are unassigned. Consider hiring or training.',
                'impact': min(100, unassigned.count() * 5),
                'confidence': 0.9,
                'task_count': unassigned.count()
            })
        
        return gaps
    
    def _predict_future_overload(self, days_ahead=7):
        """Predict which users will be overloaded in the future."""
        from tasks.models import Task
        from users.models import User
        
        future_date = timezone.now() + timedelta(days=days_ahead)
        overloads = []
        
        users = User.objects.filter(company=self.company, is_active=True)
        
        for user in users:
            # Tasks with deadline in next N days
            upcoming_tasks = Task.objects.filter(
                assigned_to=user,
                status__in=['open', 'in_progress'],
                deadline__lte=future_date
            )
            
            total_hours = sum(t.estimated_hours or 4 for t in upcoming_tasks)
            
            if total_hours > 40:  # More than a week's work
                overloads.append((user, total_hours))
        
        return sorted(overloads, key=lambda x: x[1], reverse=True)
    
    def recommend_assignee(self, task):
        """Recommend the best user to assign a task to."""
        from users.models import User
        
        eligible_users = User.objects.filter(
            company=self.company,
            role__in=['employee', 'manager'],
            is_active=True
        )
        
        scores = []
        for user in eligible_users:
            score = self._calculate_assignment_score(user, task)
            scores.append({
                'user': user,
                'score': score['total'],
                'factors': score['factors']
            })
        
        scores.sort(key=lambda x: x['score'], reverse=True)
        return scores[:3]
    
    def _calculate_assignment_score(self, user, task):
        """Calculate assignment suitability score for a user."""
        from tasks.models import Task
        from progress.models import ProgressUpdate
        
        factors = {}
        
        # 1. Current workload (lower is better)
        active_tasks = Task.objects.filter(
            assigned_to=user,
            status__in=['open', 'in_progress']
        ).count()
        workload_score = max(0, 100 - (active_tasks * 10))
        factors['workload'] = {
            'value': active_tasks,
            'score': workload_score,
            'weight': 0.3
        }
        
        # 2. Project familiarity
        project_tasks = Task.objects.filter(
            assigned_to=user,
            project=task.project
        ).count()
        familiarity_score = min(100, project_tasks * 15)
        factors['familiarity'] = {
            'value': project_tasks,
            'score': familiarity_score,
            'weight': 0.25
        }
        
        # 3. Historical performance
        completed = Task.objects.filter(
            assigned_to=user,
            status='completed'
        )
        on_time = completed.filter(
            completed_at__lte=models.F('deadline')
        ).count()
        total_completed = completed.count()
        
        if total_completed > 0:
            performance_rate = (on_time / total_completed) * 100
        else:
            performance_rate = 50
        
        factors['performance'] = {
            'value': f'{on_time}/{total_completed}',
            'score': performance_rate,
            'weight': 0.2
        }
        
        # 4. Recent activity
        recent_updates = ProgressUpdate.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        activity_score = min(100, recent_updates * 20)
        factors['activity'] = {
            'value': recent_updates,
            'score': activity_score,
            'weight': 0.15
        }
        
        # 5. Availability (based on upcoming deadlines)
        upcoming_deadlines = Task.objects.filter(
            assigned_to=user,
            status__in=['open', 'in_progress'],
            deadline__lte=timezone.now() + timedelta(days=3)
        ).count()
        availability_score = max(0, 100 - (upcoming_deadlines * 20))
        factors['availability'] = {
            'value': upcoming_deadlines,
            'score': availability_score,
            'weight': 0.1
        }
        
        # Calculate weighted total
        total = sum(f['score'] * f['weight'] for f in factors.values())
        
        return {'total': total, 'factors': factors}


class CalendarSchedulingService:
    """Service for smart calendar scheduling and conflict avoidance."""
    
    def __init__(self, user):
        self.user = user
    
    def suggest_schedule(self, task, duration_hours=2):
        """Suggest optimal time slot for working on a task."""
        from .models import CalendarEvent, ScheduleSuggestion
        
        # Get user's calendar events for next 7 days
        start_date = timezone.now()
        end_date = start_date + timedelta(days=7)
        
        events = CalendarEvent.objects.filter(
            user=self.user,
            start_time__gte=start_date,
            start_time__lte=end_date
        ).order_by('start_time')
        
        # Find available slots
        available_slots = self._find_available_slots(
            events, start_date, end_date, duration_hours
        )
        
        if not available_slots:
            return None
        
        # Score and rank slots
        scored_slots = []
        for slot in available_slots:
            score = self._score_time_slot(slot, task)
            scored_slots.append((slot, score))
        
        scored_slots.sort(key=lambda x: x[1], reverse=True)
        best_slot = scored_slots[0][0]
        
        # Create suggestion
        conflicts_avoided = self._get_potential_conflicts(best_slot, events)
        
        suggestion = ScheduleSuggestion.objects.create(
            user=self.user,
            task=task,
            suggested_start=best_slot['start'],
            suggested_end=best_slot['end'],
            reason=self._generate_reason(best_slot, task),
            confidence_score=scored_slots[0][1] / 100,
            conflicts_avoided=[{
                'title': e.title,
                'start': e.start_time.isoformat(),
                'end': e.end_time.isoformat() if e.end_time else None
            } for e in conflicts_avoided]
        )
        
        return suggestion
    
    def _find_available_slots(self, events, start_date, end_date, duration_hours):
        """Find available time slots."""
        slots = []
        
        # Work hours: 9 AM to 6 PM
        work_start_hour = 9
        work_end_hour = 18
        
        current = start_date.replace(hour=work_start_hour, minute=0, second=0)
        if current < start_date:
            current = start_date
        
        event_list = list(events)
        event_idx = 0
        
        while current < end_date:
            # Skip non-work hours
            if current.hour < work_start_hour:
                current = current.replace(hour=work_start_hour, minute=0)
            if current.hour >= work_end_hour:
                current = current.replace(hour=work_start_hour, minute=0) + timedelta(days=1)
                continue
            
            # Skip weekends
            if current.weekday() >= 5:
                current += timedelta(days=1)
                continue
            
            slot_end = current + timedelta(hours=duration_hours)
            
            # Check if slot conflicts with any event
            has_conflict = False
            while event_idx < len(event_list):
                event = event_list[event_idx]
                if event.end_time and event.end_time <= current:
                    event_idx += 1
                    continue
                if event.start_time >= slot_end:
                    break
                # Conflict
                has_conflict = True
                current = event.end_time or event.start_time + timedelta(hours=1)
                break
            
            if not has_conflict and slot_end.hour <= work_end_hour:
                slots.append({
                    'start': current,
                    'end': slot_end
                })
            
            current += timedelta(hours=1)
        
        return slots[:10]  # Return top 10 slots
    
    def _score_time_slot(self, slot, task):
        """Score a time slot based on various factors."""
        score = 50  # Base score
        
        start = slot['start']
        
        # Prefer morning slots (higher focus)
        if 9 <= start.hour <= 11:
            score += 20
        elif 14 <= start.hour <= 16:
            score += 10
        
        # Prefer slots on days with fewer meetings
        # (Would need more context to implement)
        
        # Consider task deadline
        if task.deadline:
            days_until = (task.deadline - start).days
            if days_until <= 1:
                score += 30  # Urgent
            elif days_until <= 3:
                score += 20
            elif days_until <= 7:
                score += 10
        
        # Consider task priority
        priority_scores = {'urgent': 20, 'high': 15, 'medium': 10, 'low': 5}
        score += priority_scores.get(task.priority, 10)
        
        return min(100, score)
    
    def _get_potential_conflicts(self, slot, events):
        """Get events that would conflict with this slot if scheduled differently."""
        conflicts = []
        for event in events:
            if event.start_time < slot['end'] and (event.end_time or event.start_time + timedelta(hours=1)) > slot['start']:
                conflicts.append(event)
        return conflicts
    
    def _generate_reason(self, slot, task):
        """Generate human-readable reason for suggestion."""
        start = slot['start']
        
        reasons = []
        
        if 9 <= start.hour <= 11:
            reasons.append("Morning slot for better focus")
        elif 14 <= start.hour <= 16:
            reasons.append("Afternoon slot when meetings are typically fewer")
        
        if task.deadline:
            days_until = (task.deadline - start).days
            if days_until <= 3:
                reasons.append(f"Deadline approaching in {days_until} days")
        
        if task.priority in ['high', 'urgent']:
            reasons.append(f"{task.priority.capitalize()} priority task")
        
        return ". ".join(reasons) if reasons else "Available slot with no conflicts"


# Import for type hints
from django.db import models
