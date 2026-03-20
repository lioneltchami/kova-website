'use client';

import { useState } from 'react';

interface SlackSettingsProps {
  initialWebhookUrl?: string | null;
  teamId: string;
}

export function SlackSettings({ initialWebhookUrl, teamId }: SlackSettingsProps) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/v1/team/slack-webhook', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, webhookUrl: webhookUrl.trim() || null }),
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'Slack webhook saved.' });
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error ?? 'Failed to save.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!webhookUrl.trim()) {
      setStatus({ type: 'error', message: 'Enter a webhook URL before testing.' });
      return;
    }
    setTesting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/v1/team/slack-webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
      });
      if (res.ok) {
        setStatus({ type: 'success', message: 'Test message sent to Slack.' });
      } else {
        setStatus({ type: 'error', message: 'Test failed. Check the webhook URL.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-kova-silver-dim">
        Create an incoming webhook in your{' '}
        <a
          href="https://api.slack.com/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="text-kova-blue hover:underline"
        >
          Slack workspace settings
        </a>{' '}
        and paste the URL here. Budget alerts will be posted to your chosen channel.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://hooks.slack.com/services/..."
          className="flex-1 px-3 py-2 bg-kova-charcoal-light border border-kova-border rounded-lg text-sm text-white placeholder:text-kova-silver-dim focus:outline-none focus:border-kova-blue"
        />
        <button
          onClick={handleTest}
          disabled={testing || !webhookUrl.trim()}
          className="px-3 py-2 text-sm font-medium border border-kova-border text-kova-silver rounded-lg hover:border-kova-blue hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {testing ? 'Sending...' : 'Test'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-kova-blue text-white text-sm font-medium rounded-lg hover:bg-kova-blue-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {status && (
        <p
          className={`text-sm ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
