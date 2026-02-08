'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings as SettingsIcon, Shield, Key, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AppSettings } from '@/types'
import {
  loadSettings,
  saveSettings,
  getDefaultSettings,
  deleteSettings,
  isEncrypted,
} from '@/lib/storage/secure-storage'
import { DEFAULT_MODELS } from '@/lib/constants'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getDefaultSettings())
  const [passphrase, setPassphrase] = useState('')
  const [unlockPassphrase, setUnlockPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [unlockError, setUnlockError] = useState('')
  const [saving, setSaving] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>(
    {}
  )

  useEffect(() => {
    loadExistingSettings()
  }, [])

  async function loadExistingSettings() {
    try {
      const encrypted = await isEncrypted()
      if (encrypted) {
        setLocked(true)
        setLoading(false)
        return
      }
      
      const loaded = await loadSettings()
      if (loaded) {
        setSettings(loaded)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUnlock() {
    if (!unlockPassphrase) {
      setUnlockError('Please enter your passphrase')
      return
    }
    
    setLoading(true)
    setUnlockError('')
    
    try {
      const loaded = await loadSettings(unlockPassphrase)
      if (loaded) {
        setSettings(loaded)
        setPassphrase(unlockPassphrase)
        setLocked(false)
      } else {
        setUnlockError('No settings found')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to decrypt'
      setUnlockError(errorMsg.includes('decrypt') ? 'Incorrect passphrase' : errorMsg)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveSettings(
        settings,
        settings.useEncryption && passphrase ? passphrase : undefined
      )
      alert('Settings saved successfully!')
    } catch (error) {
      alert('Failed to save settings: ' + error)
    } finally {
      setSaving(false)
    }
  }

  async function handleClearKeys() {
    const confirmed = window.confirm('Clear all stored API keys and reset settings?')
    if (!confirmed) return
    await deleteSettings()
    setSettings(getDefaultSettings())
    setPassphrase('')
    setUnlockPassphrase('')
    setShowPassphrase(false)
    setTestResults({})
    setLocked(false)
  }

  async function testProvider(provider: keyof typeof settings.providers) {
    const providerConfig = settings.providers[provider]
    if (!providerConfig?.apiKey) {
      alert(`Please enter an API key for ${provider}`)
      return
    }

    setTestResults({ ...testResults, [provider]: 'testing' })

    try {
      const response = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: providerConfig.apiKey,
          model: providerConfig.defaultModel,
        }),
      })

      const result = await response.json()
      setTestResults({
        ...testResults,
        [provider]: result.success ? 'success' : 'error',
      })

      if (!result.success) {
        alert(`Test failed: ${result.message}`)
      }
    } catch (error) {
      setTestResults({ ...testResults, [provider]: 'error' })
      alert(`Test failed: ${error}`)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (locked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <nav className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">Unlock Settings</span>
            </Link>
            <Link href="/">
              <Button variant="ghost">Back to Home</Button>
            </Link>
          </div>
        </nav>
        
        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                <CardTitle>Settings Are Encrypted</CardTitle>
              </div>
              <CardDescription>
                Enter your passphrase to unlock your API keys and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Passphrase</label>
                <Input
                  type="password"
                  value={unlockPassphrase}
                  onChange={(e) => setUnlockPassphrase(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  placeholder="Enter your passphrase"
                  className="w-full"
                />
                {unlockError && (
                  <p className="mt-2 text-sm text-red-600">{unlockError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUnlock} className="flex-1" disabled={!unlockPassphrase}>
                  <Key className="mr-2 h-4 w-4" />
                  Unlock
                </Button>
                <Button onClick={handleClearKeys} variant="outline">
                  Reset All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">Settings</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link href="/app">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Security Notice */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Security & Privacy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>✓ All API keys are stored locally in your browser (IndexedDB)</p>
            <p>✓ Keys are never sent to our servers or committed to git</p>
            <p>✓ Optional AES-256 encryption with your passphrase</p>
            <p>✓ This is a public repo - configure keys here, not in .env files</p>
          </CardContent>
        </Card>

        {/* Encryption Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Encryption</CardTitle>
            <CardDescription>
              Optionally encrypt your API keys with a passphrase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={settings.useEncryption}
                onChange={(e) =>
                  setSettings({ ...settings, useEncryption: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label className="font-medium">Use encryption (recommended)</label>
            </div>
            {settings.useEncryption && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Passphrase</label>
                <Input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter a strong passphrase"
                />
                <button
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {showPassphrase ? 'Hide' : 'Show'} passphrase
                </button>
                <p className="text-sm text-gray-600">
                  Leave empty to use device-only encryption (simpler but less secure)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Mode */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Demo Mode</CardTitle>
            <CardDescription>Use mock responses and heuristic scoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={settings.demoMode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    demoMode: e.target.checked,
                  })
                }
                className="h-4 w-4"
              />
              <label className="font-medium">Enable Demo Mode</label>
            </div>
            <p className="text-sm text-gray-600">
              Demo Mode uses mock responses and the heuristic judge. This is ideal for quick setup
              or public demos.
            </p>
          </CardContent>
        </Card>

        {/* API Keys */}
        {Object.entries(DEFAULT_MODELS).map(([provider, models]) => (
          <Card key={provider} className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="capitalize">{provider}</CardTitle>
                  <CardDescription>Configure your {provider} API key</CardDescription>
                </div>
                {testResults[provider] && (
                  <Badge
                    variant={testResults[provider] === 'success' ? 'default' : 'destructive'}
                  >
                    {testResults[provider] === 'testing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    {testResults[provider] === 'success' && <CheckCircle className="mr-1 h-3 w-3" />}
                    {testResults[provider] === 'error' && <XCircle className="mr-1 h-3 w-3" />}
                    {testResults[provider] === 'testing' ? 'Testing...' : testResults[provider]}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  value={settings.providers[provider as keyof typeof settings.providers]?.apiKey || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      providers: {
                        ...settings.providers,
                        [provider]: {
                          apiKey: e.target.value,
                          defaultModel:
                            settings.providers[provider as keyof typeof settings.providers]
                              ?.defaultModel || models[0],
                        },
                      },
                    })
                  }
                  placeholder={`Enter your ${provider} API key`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Model</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={
                    settings.providers[provider as keyof typeof settings.providers]
                      ?.defaultModel || models[0]
                  }
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      providers: {
                        ...settings.providers,
                        [provider]: {
                          apiKey:
                            settings.providers[provider as keyof typeof settings.providers]
                              ?.apiKey || '',
                          defaultModel: e.target.value,
                        },
                      },
                    })
                  }
                >
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testProvider(provider as keyof typeof settings.providers)}
              >
                <Key className="mr-2 h-4 w-4" />
                Test Connection
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleClearKeys}>
            Clear Keys
          </Button>
          <Link href="/app">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
