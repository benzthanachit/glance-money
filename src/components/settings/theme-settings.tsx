'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/lib/contexts/theme-context'
import { Palette, Sun, Moon, Monitor } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { getStoredPreferences, savePreferences } from '@/lib/utils/preferences'

type SystemTheme = 'light' | 'dark' | 'system'

const themeOptions = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon }
]

export function ThemeSettings() {
  const t = useTranslations('settings')
  const { netStatusTheme } = useTheme()
  const [systemTheme, setSystemTheme] = useState<SystemTheme>('system')

  useEffect(() => {
    const preferences = getStoredPreferences()
    if (preferences.theme) {
      setSystemTheme(preferences.theme)
    }
  }, [])

  const handleSystemThemeChange = useCallback((newTheme: string) => {
    const theme = newTheme as SystemTheme
    setSystemTheme(theme)
    savePreferences({ theme })
    
    // Apply system theme to document
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System theme - check user's system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [])

  const getThemeIcon = useCallback((theme: SystemTheme) => {
    const option = themeOptions.find(opt => opt.value === theme)
    return option ? option.icon : Monitor
  }, [])

  const ThemeIcon = getThemeIcon(systemTheme)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {t('theme')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">System Theme</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ThemeIcon className="h-3 w-3" />
                {themeOptions.find(opt => opt.value === systemTheme)?.label}
              </p>
            </div>
            <Select value={systemTheme} onValueChange={handleSystemThemeChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Financial Status Theme</p>
                <p className="text-sm text-muted-foreground">
                  Current: {netStatusTheme === 'positive' ? 'Green (Positive)' : 'Red (Negative)'}
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full ${
                netStatusTheme === 'positive' ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Financial status theme changes automatically based on your net status calculation.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}