'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { useTranslations } from 'next-intl'
import { useLanguage } from '@/lib/contexts/language-context'
import { Globe } from 'lucide-react'

export function LanguageSettings() {
  const t = useTranslations('settings')
  const { locale } = useLanguage()

  const languageNames = {
    th: 'ไทย (Thai)',
    en: 'English'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('language')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Language</p>
              <p className="text-sm text-muted-foreground">
                {languageNames[locale]}
              </p>
            </div>
            <LanguageSwitcher className="w-48" />
          </div>
          <p className="text-xs text-muted-foreground">
            Language preference is automatically saved and will persist across sessions.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}