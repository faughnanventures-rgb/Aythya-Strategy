/**
 * Goals API Route
 * 
 * Handles CRUD operations for values, goals, and tasks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { 
  CreateValueRequest, 
  CreateGoalRequest, 
  CreateTaskRequest,
  UpdateGoalRequest,
  UpdateTaskRequest,
  DashboardStats
} from '@/types/goals';

// ============================================
// GET: Fetch all values, goals, tasks, and stats
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('plan_id');
    const includeCompleted = searchParams.get('include_completed') !== 'false';

    // Fetch values
    let valuesQuery = supabase
      .from('user_values')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (planId) {
      valuesQuery = valuesQuery.eq('plan_id', planId);
    }

    const { data: values, error: valuesError } = await valuesQuery;
    if (valuesError) throw valuesError;

    // Fetch goals
    let goalsQuery = supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });

    if (planId) {
      goalsQuery = goalsQuery.eq('plan_id', planId);
    }

    if (!includeCompleted) {
      goalsQuery = goalsQuery.neq('status', 'completed');
    }

    const { data: goals, error: goalsError } = await goalsQuery;
    if (goalsError) throw goalsError;

    // Fetch tasks
    let tasksQuery = supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: true });

    if (!includeCompleted) {
      tasksQuery = tasksQuery.neq('status', 'completed');
    }

    const { data: tasks, error: tasksError } = await tasksQuery;
    if (tasksError) throw tasksError;

    // Calculate stats
    const now = new Date();
    const stats: DashboardStats = {
      total_goals: goals?.length || 0,
      completed_goals: goals?.filter(g => g.status === 'completed').length || 0,
      in_progress_goals: goals?.filter(g => g.status === 'in_progress').length || 0,
      total_tasks: tasks?.length || 0,
      completed_tasks: tasks?.filter(t => t.status === 'completed').length || 0,
      overdue_tasks: tasks?.filter(t => 
        t.due_date && 
        new Date(t.due_date) < now && 
        t.status !== 'completed'
      ).length || 0,
      upcoming_deadlines: tasks?.filter(t => {
        if (!t.due_date || t.status === 'completed') return false;
        const dueDate = new Date(t.due_date);
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return dueDate >= now && dueDate <= weekFromNow;
      }).length || 0,
      streak_days: await calculateStreak(supabase, user.id),
    };

    return NextResponse.json({
      values: values || [],
      goals: goals || [],
      tasks: tasks || [],
      stats,
    });

  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST: Create new value, goal, or task
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (!type || !['value', 'goal', 'task'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'value':
        result = await createValue(supabase, user.id, data as CreateValueRequest);
        break;
      case 'goal':
        result = await createGoal(supabase, user.id, data as CreateGoalRequest);
        break;
      case 'task':
        result = await createTask(supabase, user.id, data as CreateTaskRequest);
        break;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Goals POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PATCH: Update value, goal, or task
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, ...updates } = body;

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 });
    }

    const table = type === 'value' ? 'user_values' : type === 'goal' ? 'user_goals' : 'user_tasks';

    // Special handling for task completion
    if (type === 'task' && updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    // Special handling for goal completion
    if (type === 'goal' && updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
      updates.progress_percentage = 100;
    }

    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);

  } catch (error) {
    console.error('Goals PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE: Remove value, goal, or task
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 });
    }

    const table = type === 'value' ? 'user_values' : type === 'goal' ? 'user_goals' : 'user_tasks';

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Goals DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function createValue(supabase: any, userId: string, data: CreateValueRequest) {
  // Get max priority
  const { data: maxPriority } = await supabase
    .from('user_values')
    .select('priority')
    .eq('user_id', userId)
    .order('priority', { ascending: false })
    .limit(1)
    .single();

  const { data: value, error } = await supabase
    .from('user_values')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      plan_id: data.plan_id,
      priority: data.priority ?? (maxPriority?.priority ?? 0) + 1,
      ai_suggested: data.ai_suggested ?? false,
      user_confirmed: false,
    })
    .select()
    .single();

  if (error) throw error;
  return value;
}

async function createGoal(supabase: any, userId: string, data: CreateGoalRequest) {
  // Get max priority
  const { data: maxPriority } = await supabase
    .from('user_goals')
    .select('priority')
    .eq('user_id', userId)
    .order('priority', { ascending: false })
    .limit(1)
    .single();

  const { data: goal, error } = await supabase
    .from('user_goals')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description,
      value_id: data.value_id,
      plan_id: data.plan_id,
      goal_type: data.goal_type ?? 'standard',
      measurement_type: data.measurement_type ?? 'qualitative',
      measurement_target: data.measurement_target,
      measurement_goal_value: data.measurement_goal_value,
      measurement_unit: data.measurement_unit,
      timeframe: data.timeframe ?? 'quarterly',
      deadline: data.deadline,
      priority: data.priority ?? (maxPriority?.priority ?? 0) + 1,
      ai_suggested: data.ai_suggested ?? false,
      user_confirmed: false,
    })
    .select()
    .single();

  if (error) throw error;
  return goal;
}

async function createTask(supabase: any, userId: string, data: CreateTaskRequest) {
  // Verify goal exists and belongs to user
  const { data: goal } = await supabase
    .from('user_goals')
    .select('id')
    .eq('id', data.goal_id)
    .eq('user_id', userId)
    .single();

  if (!goal) {
    throw new Error('Goal not found');
  }

  // Get max priority for this goal
  const { data: maxPriority } = await supabase
    .from('user_tasks')
    .select('priority')
    .eq('goal_id', data.goal_id)
    .order('priority', { ascending: false })
    .limit(1)
    .single();

  const { data: task, error } = await supabase
    .from('user_tasks')
    .insert({
      user_id: userId,
      goal_id: data.goal_id,
      title: data.title,
      description: data.description,
      is_recurring: data.is_recurring ?? false,
      recurrence_pattern: data.recurrence_pattern,
      recurrence_days: data.recurrence_days,
      recurrence_end_date: data.recurrence_end_date,
      due_date: data.due_date,
      due_time: data.due_time,
      estimated_minutes: data.estimated_minutes,
      priority: data.priority ?? (maxPriority?.priority ?? 0) + 1,
    })
    .select()
    .single();

  if (error) throw error;
  return task;
}

async function calculateStreak(supabase: any, userId: string): Promise<number> {
  // Get tasks completed in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: completedTasks } = await supabase
    .from('user_tasks')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', thirtyDaysAgo.toISOString())
    .order('completed_at', { ascending: false });

  if (!completedTasks?.length) return 0;

  // Count consecutive days with completed tasks
  const completionDates = new Set(
    completedTasks.map((t: any) => 
      new Date(t.completed_at).toDateString()
    )
  );

  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    
    if (completionDates.has(checkDate.toDateString())) {
      streak++;
    } else if (i > 0) {
      // Allow today to not have completions yet
      break;
    }
  }

  return streak;
}
