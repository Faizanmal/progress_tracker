"""
AI Services for Progress Tracker
Implements smart task assignment, progress prediction, and automated insights.
"""
from django.db.models import Avg, Sum
from django.utils import timezone
from datetime import timedelta
import statistics
from tasks.models import Task
from progress.models import ProgressUpdate
from users.models import User
from analytics.models import TimeEntry


class TaskAssignmentRecommender:
    """Smart task assignment recommendations based on workload and skills."""
    
    def __init__(self, company):
        self.company = company
    
    def recommend_assignee(self, task):
        """Recommend the best user to assign a task to."""
        eligible_users = User.objects.filter(
            company=self.company,
            role__in=['employee', 'manager'],
            is_active=True
        )
        
        scores = []
        for user in eligible_users:
            score = self._calculate_user_score(user, task)
            scores.append({
                'user': user,
                'score': score['total'],
                'factors': score['factors']
            })
        
        # Sort by score descending
        scores.sort(key=lambda x: x['score'], reverse=True)
        return scores[:3]  # Return top 3 recommendations
    
    def _calculate_user_score(self, user, task):
        """Calculate assignment score for a user."""
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
        
        # 2. Historical performance on similar tasks
        similar_tasks = Task.objects.filter(
            assigned_to=user,
            status='completed',
            priority=task.priority
        )
        completion_rate = similar_tasks.count() / max(1, Task.objects.filter(
            assigned_to=user,
            priority=task.priority
        ).count()) * 100
        factors['performance'] = {
            'value': f"{completion_rate:.1f}%",
            'score': completion_rate,
            'weight': 0.25
        }
        
        # 3. Average completion time
        completed_tasks = Task.objects.filter(
            assigned_to=user,
            status='completed',
            started_at__isnull=False,
            completed_at__isnull=False
        )
        if completed_tasks.exists():
            avg_days = []
            for t in completed_tasks[:20]:
                delta = (t.completed_at - t.started_at).days
                avg_days.append(delta)
            avg_completion = statistics.mean(avg_days) if avg_days else 0
            speed_score = max(0, 100 - (avg_completion * 5))
        else:
            speed_score = 50  # Neutral for new users
            avg_completion = 0
        factors['speed'] = {
            'value': f"{avg_completion:.1f} days avg",
            'score': speed_score,
            'weight': 0.2
        }
        
        # 4. Project familiarity
        project_tasks = Task.objects.filter(
            assigned_to=user,
            project=task.project
        ).count()
        familiarity_score = min(100, project_tasks * 20)
        factors['familiarity'] = {
            'value': project_tasks,
            'score': familiarity_score,
            'weight': 0.15
        }
        
        # 5. Recent activity (have they been active?)
        recent_updates = ProgressUpdate.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        activity_score = min(100, recent_updates * 15)
        factors['activity'] = {
            'value': recent_updates,
            'score': activity_score,
            'weight': 0.1
        }
        
        # Calculate weighted total
        total = sum(f['score'] * f['weight'] for f in factors.values())
        
        return {'total': total, 'factors': factors}


class ProgressPredictor:
    """Predict task completion dates and risk levels."""
    
    def predict_completion(self, task):
        """Predict when a task will be completed."""
        if task.status == 'completed':
            return {
                'predicted_date': task.completed_at,
                'confidence': 1.0,
                'risk_score': 0,
                'risk_factors': []
            }
        
        # Gather historical data
        user = task.assigned_to
        if not user:
            return self._default_prediction(task)
        
        # Average completion time for similar tasks
        similar_completed = Task.objects.filter(
            assigned_to=user,
            status='completed',
            priority=task.priority,
            started_at__isnull=False,
            completed_at__isnull=False
        )
        
        if similar_completed.count() < 3:
            return self._default_prediction(task)
        
        completion_times = []
        for t in similar_completed[:20]:
            delta = (t.completed_at - t.started_at).total_seconds() / 86400  # Days
            completion_times.append(delta)
        
        avg_days = statistics.mean(completion_times)
        
        # Adjust based on current progress
        progress_factor = 1 - (task.progress_percentage / 100)
        estimated_remaining_days = avg_days * progress_factor
        
        # Start from now or started_at
        start_point = task.started_at or timezone.now()
        predicted_date = start_point + timedelta(days=estimated_remaining_days)
        
        # Calculate confidence based on data quality
        confidence = min(0.9, 0.5 + (similar_completed.count() * 0.05))
        
        # Risk factors
        risk_factors = []
        risk_score = 0
        
        # Check if already overdue
        if task.deadline and timezone.now() > task.deadline:
            risk_factors.append('Task is already overdue')
            risk_score += 0.4
        elif task.deadline and predicted_date > task.deadline:
            risk_factors.append('Predicted completion after deadline')
            risk_score += 0.3
        
        # Check for blockers
        if task.status == 'blocked':
            risk_factors.append('Task is currently blocked')
            risk_score += 0.3
        
        # Check progress rate
        if task.started_at:
            days_elapsed = (timezone.now() - task.started_at).days
            if days_elapsed > 0:
                expected_progress = (days_elapsed / avg_days) * 100
                if task.progress_percentage < expected_progress * 0.5:
                    risk_factors.append('Progress slower than expected')
                    risk_score += 0.2
        
        # High workload
        active_tasks = Task.objects.filter(
            assigned_to=user,
            status__in=['open', 'in_progress']
        ).count()
        if active_tasks > 5:
            risk_factors.append(f'Assignee has {active_tasks} active tasks')
            risk_score += 0.1
        
        return {
            'predicted_date': predicted_date,
            'confidence': confidence,
            'estimated_hours_remaining': estimated_remaining_days * 8,  # Assume 8-hour days
            'risk_score': min(1.0, risk_score),
            'risk_factors': risk_factors
        }
    
    def _default_prediction(self, task):
        """Default prediction when not enough data."""
        # Estimate based on priority
        days_by_priority = {
            'low': 14,
            'medium': 7,
            'high': 3,
            'urgent': 1
        }
        estimated_days = days_by_priority.get(task.priority, 7)
        progress_factor = 1 - (task.progress_percentage / 100)
        
        start_point = task.started_at or timezone.now()
        predicted_date = start_point + timedelta(days=estimated_days * progress_factor)
        
        return {
            'predicted_date': predicted_date,
            'confidence': 0.3,  # Low confidence
            'estimated_hours_remaining': estimated_days * progress_factor * 8,
            'risk_score': 0.5,  # Medium risk due to uncertainty
            'risk_factors': ['Limited historical data for prediction']
        }


class SummaryGenerator:
    """Generate automated weekly summaries."""
    
    def __init__(self, user):
        self.user = user
        self.company = user.company
    
    def generate_weekly_summary(self, week_start=None):
        """Generate a weekly summary for the user."""
        if not week_start:
            today = timezone.now().date()
            week_start = today - timedelta(days=today.weekday() + 7)  # Last week
        
        week_end = week_start + timedelta(days=6)
        
        # Gather metrics
        metrics = self._gather_metrics(week_start, week_end)
        highlights = self._identify_highlights(metrics)
        concerns = self._identify_concerns(metrics)
        recommendations = self._generate_recommendations(metrics, concerns)
        summary_text = self._compose_summary(metrics, highlights, concerns)
        
        return {
            'week_start': week_start,
            'week_end': week_end,
            'summary_text': summary_text,
            'highlights': highlights,
            'concerns': concerns,
            'recommendations': recommendations,
            'metrics': metrics
        }
    
    def _gather_metrics(self, week_start, week_end):
        """Gather all relevant metrics for the week."""
        tasks = Task.objects.filter(assigned_to=self.user)
        time_entries = TimeEntry.objects.filter(
            user=self.user,
            start_time__date__gte=week_start,
            start_time__date__lte=week_end,
            is_running=False
        )
        progress_updates = ProgressUpdate.objects.filter(
            user=self.user,
            created_at__date__gte=week_start,
            created_at__date__lte=week_end
        )
        
        completed_this_week = tasks.filter(
            completed_at__date__gte=week_start,
            completed_at__date__lte=week_end
        )
        
        total_minutes = time_entries.aggregate(total=Sum('duration_minutes'))['total'] or 0
        
        return {
            'tasks_completed': completed_this_week.count(),
            'tasks_in_progress': tasks.filter(status='in_progress').count(),
            'tasks_blocked': tasks.filter(status='blocked').count(),
            'total_hours_logged': round(total_minutes / 60, 1),
            'progress_updates_submitted': progress_updates.count(),
            'average_progress_increase': progress_updates.aggregate(
                avg=Avg('progress_percentage')
            )['avg'] or 0,
            'overdue_tasks': tasks.filter(
                deadline__lt=timezone.now(),
                status__in=['open', 'in_progress']
            ).count()
        }
    
    def _identify_highlights(self, metrics):
        """Identify positive achievements."""
        highlights = []
        
        if metrics['tasks_completed'] > 0:
            highlights.append(f"Completed {metrics['tasks_completed']} task(s)")
        
        if metrics['total_hours_logged'] >= 35:
            highlights.append(f"Logged {metrics['total_hours_logged']} hours of productive work")
        
        if metrics['progress_updates_submitted'] >= 5:
            highlights.append(f"Submitted {metrics['progress_updates_submitted']} progress updates - great communication!")
        
        if metrics['tasks_blocked'] == 0 and metrics['tasks_in_progress'] > 0:
            highlights.append("No blocked tasks - smooth progress!")
        
        return highlights
    
    def _identify_concerns(self, metrics):
        """Identify potential issues."""
        concerns = []
        
        if metrics['tasks_blocked'] > 0:
            concerns.append(f"{metrics['tasks_blocked']} task(s) currently blocked")
        
        if metrics['overdue_tasks'] > 0:
            concerns.append(f"{metrics['overdue_tasks']} overdue task(s) need attention")
        
        if metrics['total_hours_logged'] < 20:
            concerns.append("Lower than expected hours logged this week")
        
        if metrics['progress_updates_submitted'] < 2:
            concerns.append("Few progress updates submitted - consider more frequent updates")
        
        return concerns
    
    def _generate_recommendations(self, metrics, concerns):
        """Generate actionable recommendations."""
        recommendations = []
        
        if metrics['tasks_blocked'] > 0:
            recommendations.append("Address blocked tasks: Reach out to stakeholders to resolve blockers")
        
        if metrics['overdue_tasks'] > 0:
            recommendations.append("Prioritize overdue tasks or request deadline extensions")
        
        if metrics['tasks_in_progress'] > 5:
            recommendations.append("Consider focusing on fewer tasks to improve completion rate")
        
        if len(concerns) == 0:
            recommendations.append("Keep up the great work! Consider taking on new challenges")
        
        return recommendations
    
    def _compose_summary(self, metrics, highlights, concerns):
        """Compose a human-readable summary."""
        parts = []
        
        parts.append(f"This week you completed {metrics['tasks_completed']} tasks and logged {metrics['total_hours_logged']} hours.")
        
        if highlights:
            parts.append("Highlights: " + "; ".join(highlights[:2]))
        
        if concerns:
            parts.append("Areas needing attention: " + "; ".join(concerns[:2]))
        
        return " ".join(parts)


class AnomalyDetector:
    """Detect anomalies in productivity and progress patterns."""
    
    def __init__(self, company):
        self.company = company
    
    def detect_anomalies(self):
        """Run all anomaly detection checks."""
        anomalies = []
        
        anomalies.extend(self._detect_recurring_blocks())
        anomalies.extend(self._detect_productivity_drops())
        anomalies.extend(self._detect_workload_imbalance())
        anomalies.extend(self._detect_missed_deadline_patterns())
        
        return anomalies
    
    def _detect_recurring_blocks(self):
        """Detect users with recurring blocked tasks."""
        anomalies = []
        
        users = User.objects.filter(company=self.company, role='employee')
        for user in users:
            blocked_count = Task.objects.filter(
                assigned_to=user,
                status='blocked'
            ).count()
            
            recent_blocks = ProgressUpdate.objects.filter(
                user=user,
                status='blocked',
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            if blocked_count >= 3 or recent_blocks >= 5:
                anomalies.append({
                    'type': 'blocked_pattern',
                    'severity': 'high' if blocked_count >= 5 else 'medium',
                    'user': user,
                    'title': f'{user.name} has recurring blocked tasks',
                    'description': f'{blocked_count} currently blocked tasks, {recent_blocks} block reports in last 30 days',
                    'suggested_actions': [
                        'Review common blockers with team lead',
                        'Consider resource reallocation',
                        'Schedule blocker resolution meeting'
                    ]
                })
        
        return anomalies
    
    def _detect_productivity_drops(self):
        """Detect significant drops in productivity."""
        anomalies = []
        
        users = User.objects.filter(company=self.company, role='employee')
        for user in users:
            # Compare last 2 weeks to previous 2 weeks
            recent = Task.objects.filter(
                assigned_to=user,
                completed_at__gte=timezone.now() - timedelta(days=14)
            ).count()
            
            previous = Task.objects.filter(
                assigned_to=user,
                completed_at__gte=timezone.now() - timedelta(days=28),
                completed_at__lt=timezone.now() - timedelta(days=14)
            ).count()
            
            if previous > 0 and recent < previous * 0.5:
                anomalies.append({
                    'type': 'productivity_drop',
                    'severity': 'medium',
                    'user': user,
                    'title': f'Productivity drop detected for {user.name}',
                    'description': f'Completed {recent} tasks vs {previous} in previous period (>50% drop)',
                    'suggested_actions': [
                        'Check for blockers or challenges',
                        'Review workload distribution',
                        'Schedule 1:1 check-in'
                    ]
                })
        
        return anomalies
    
    def _detect_workload_imbalance(self):
        """Detect workload imbalances in the team."""
        anomalies = []
        
        users = User.objects.filter(company=self.company, role='employee')
        workloads = []
        
        for user in users:
            active_tasks = Task.objects.filter(
                assigned_to=user,
                status__in=['open', 'in_progress']
            ).count()
            workloads.append({'user': user, 'count': active_tasks})
        
        if len(workloads) >= 3:
            counts = [w['count'] for w in workloads]
            avg_workload = statistics.mean(counts)
            
            for w in workloads:
                if w['count'] > avg_workload * 2 and w['count'] > 5:
                    anomalies.append({
                        'type': 'workload_imbalance',
                        'severity': 'medium',
                        'user': w['user'],
                        'title': f"High workload for {w['user'].name}",
                        'description': f"{w['count']} active tasks vs team average of {avg_workload:.1f}",
                        'suggested_actions': [
                            'Consider redistributing tasks',
                            'Review task priorities',
                            'Discuss with team lead'
                        ]
                    })
        
        return anomalies
    
    def _detect_missed_deadline_patterns(self):
        """Detect patterns of missed deadlines."""
        anomalies = []
        
        users = User.objects.filter(company=self.company, role='employee')
        for user in users:
            overdue = Task.objects.filter(
                assigned_to=user,
                deadline__lt=timezone.now(),
                status__in=['open', 'in_progress', 'blocked']
            ).count()
            
            total_with_deadline = Task.objects.filter(
                assigned_to=user,
                deadline__isnull=False
            ).count()
            
            if total_with_deadline > 0 and overdue / total_with_deadline > 0.3:
                anomalies.append({
                    'type': 'missed_deadlines',
                    'severity': 'high',
                    'user': user,
                    'title': f'Deadline concerns for {user.name}',
                    'description': f'{overdue} of {total_with_deadline} deadlined tasks are overdue',
                    'suggested_actions': [
                        'Review deadline setting process',
                        'Improve estimation accuracy',
                        'Consider workload adjustment'
                    ]
                })
        
        return anomalies
