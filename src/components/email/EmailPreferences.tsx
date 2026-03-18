'use client';

/**
 * Email Preferences Component
 * 
 * Allows users to configure their email notification settings:
 * - Weekly/daily digest
 * - Deadline reminders
 * - Quarterly summaries
 */

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Bell, 
  Calendar, 
  Clock, 
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { EmailPreferences, DigestFrequency } from '@/types/goals';

interface EmailPreferencesFormProps {
  initialPreferences?: EmailPreferences | null;
  onSave?: (preferences: EmailPreferences) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

export function EmailPreferencesForm({ initialPreferences, onSave }: EmailPreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(!initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Form state
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>('weekly');
  const [digestDay, setDigestDay] = useState(0); // Sunday
  const [digestTime, setDigestTime] = useState('09:00');
  const [quarterlySummary, setQuarterlySummary] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [deadlineDays, setDeadlineDays] = useState<number[]>([7, 3, 1]);
  const [celebrationEmails, setCelebrationEmails] = useState(true);
  const [timezone, setTimezone] = useState('America/New_York');

  // Load initial preferences
  useEffect(() => {
    if (initialPreferences) {
      setDigestEnabled(initialPreferences.digest_enabled);
      setDigestFrequency(initialPreferences.digest_frequency);
      setDigestDay(initialPreferences.digest_day);
      setDigestTime(initialPreferences.digest_time);
      setQuarterlySummary(initialPreferences.quarterly_summary_enabled);
      setDeadlineReminders(initialPreferences.deadline_reminders_enabled);
      setDeadlineDays(initialPreferences.deadline_days_before);
      setCelebrationEmails(initialPreferences.celebration_emails_enabled);
      setTimezone(initialPreferences.timezone);
      setIsLoading(false);
    } else {
      fetchPreferences();
    }
  }, [initialPreferences]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/email-preferences');
      if (response.ok) {
        const prefs = await response.json();
        if (prefs) {
          setDigestEnabled(prefs.digest_enabled);
          setDigestFrequency(prefs.digest_frequency);
          setDigestDay(prefs.digest_day);
          setDigestTime(prefs.digest_time);
          setQuarterlySummary(prefs.quarterly_summary_enabled);
          setDeadlineReminders(prefs.deadline_reminders_enabled);
          setDeadlineDays(prefs.deadline_days_before || [7, 3, 1]);
          setCelebrationEmails(prefs.celebration_emails_enabled);
          setTimezone(prefs.timezone);
        }
      }
    } catch (err) {
      setError('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);

    const updates = {
      digest_enabled: digestEnabled,
      digest_frequency: digestFrequency,
      digest_day: digestDay,
      digest_time: digestTime,
      quarterly_summary_enabled: quarterlySummary,
      deadline_reminders_enabled: deadlineReminders,
      deadline_days_before: deadlineDays,
      celebration_emails_enabled: celebrationEmails,
      timezone,
    };

    try {
      const response = await fetch('/api/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to save');

      const saved = await response.json();
      onSave?.(saved);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDeadlineDay = (day: number) => {
    if (deadlineDays.includes(day)) {
      setDeadlineDays(deadlineDays.filter(d => d !== day));
    } else {
      setDeadlineDays([...deadlineDays, day].sort((a, b) => b - a));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-sage-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
          <Mail className="w-5 h-5 text-sage-600" />
          Email Preferences
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Choose how and when you want to receive email updates about your goals.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Timezone */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-stone-500" />
          <h3 className="font-medium text-stone-800">Your Timezone</h3>
        </div>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full md:w-auto px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent"
        >
          {TIMEZONES.map(tz => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>

      {/* Weekly/Daily Digest */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-stone-500" />
            <div>
              <h3 className="font-medium text-stone-800">Progress Digest</h3>
              <p className="text-sm text-stone-500">Get a summary of upcoming tasks and recent progress</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={digestEnabled}
              onChange={(e) => setDigestEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:ring-2 peer-focus:ring-sage-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage-500"></div>
          </label>
        </div>

        {digestEnabled && (
          <div className="space-y-4 pl-8 border-l-2 border-stone-100 ml-2">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Frequency</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDigestFrequency('weekly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    digestFrequency === 'weekly'
                      ? 'bg-sage-100 text-sage-700 ring-2 ring-sage-200'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setDigestFrequency('daily')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    digestFrequency === 'daily'
                      ? 'bg-sage-100 text-sage-700 ring-2 ring-sage-200'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Daily
                </button>
              </div>
            </div>

            {digestFrequency === 'weekly' && (
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">Send on</label>
                <select
                  value={digestDay}
                  onChange={(e) => setDigestDay(Number(e.target.value))}
                  className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-sage-500"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Time</label>
              <input
                type="time"
                value={digestTime}
                onChange={(e) => setDigestTime(e.target.value)}
                className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-sage-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Deadline Reminders */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-stone-500" />
            <div>
              <h3 className="font-medium text-stone-800">Deadline Reminders</h3>
              <p className="text-sm text-stone-500">Get reminded before task deadlines</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={deadlineReminders}
              onChange={(e) => setDeadlineReminders(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:ring-2 peer-focus:ring-sage-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage-500"></div>
          </label>
        </div>

        {deadlineReminders && (
          <div className="pl-8 border-l-2 border-stone-100 ml-2">
            <label className="text-sm font-medium text-stone-700 mb-3 block">
              Remind me before deadline:
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 5, 7, 14].map(day => (
                <button
                  key={day}
                  onClick={() => toggleDeadlineDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    deadlineDays.includes(day)
                      ? 'bg-sage-100 text-sage-700 ring-2 ring-sage-200'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {day} day{day > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quarterly Summaries */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-stone-500" />
            <div>
              <h3 className="font-medium text-stone-800">Quarterly Summaries</h3>
              <p className="text-sm text-stone-500">Get a comprehensive progress report every quarter</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={quarterlySummary}
              onChange={(e) => setQuarterlySummary(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:ring-2 peer-focus:ring-sage-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage-500"></div>
          </label>
        </div>
      </div>

      {/* Celebration Emails */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <div>
              <h3 className="font-medium text-stone-800">Goal Celebrations</h3>
              <p className="text-sm text-stone-500">Get a congratulations email when you complete a goal</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={celebrationEmails}
              onChange={(e) => setCelebrationEmails(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:ring-2 peer-focus:ring-sage-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage-500"></div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <span className="text-sm text-sage-600 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Saved!
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
}

export default EmailPreferencesForm;
