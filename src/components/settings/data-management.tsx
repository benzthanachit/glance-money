'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Download, Upload, Database, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { transactionService } from '@/lib/services/transactionService'
import { goalService } from '@/lib/services/goalService'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/formatting'
import { useLocale } from '@/lib/contexts/language-context'

interface ExportData {
  version: string
  exportDate: string
  transactions: any[]
  goals: any[]
  preferences: any
}

export function DataManagement() {
  const t = useTranslations('settings')
  const locale = useLocale()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // Fetch all user data
      const [transactions, goals] = await Promise.all([
        transactionService.getTransactions(),
        goalService.getGoals()
      ])

      // Get user preferences
      const preferences = localStorage.getItem('glance-money-preferences')
      const parsedPreferences = preferences ? JSON.parse(preferences) : {}

      // Create export data structure
      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        transactions,
        goals,
        preferences: parsedPreferences
      }

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `glance-money-export-${formatDate({ 
        locale, 
        date: new Date(), 
        format: 'short' 
      }).replace(/\//g, '-')}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Export Successful', {
        description: 'Your data has been exported successfully.',
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export Failed', {
        description: 'Failed to export data. Please try again.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const fileContent = await file.text()
      const importData: ExportData = JSON.parse(fileContent)

      // Validate import data structure
      if (!importData.version || !importData.transactions || !importData.goals) {
        throw new Error('Invalid export file format')
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        'This will replace all your current data. Are you sure you want to continue?'
      )
      
      if (!confirmed) {
        setIsImporting(false)
        return
      }

      // Import transactions
      let importedTransactions = 0
      for (const transaction of importData.transactions) {
        try {
          await transactionService.createTransaction({
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            description: transaction.description,
            date: transaction.date,
            is_recurring: transaction.is_recurring
          })
          importedTransactions++
        } catch (error) {
          console.warn('Failed to import transaction:', transaction, error)
        }
      }

      // Import goals
      let importedGoals = 0
      for (const goal of importData.goals) {
        try {
          await goalService.createGoal({
            name: goal.name,
            targetAmount: goal.target_amount || goal.targetAmount,
            deadline: goal.deadline
          })
          importedGoals++
        } catch (error) {
          console.warn('Failed to import goal:', goal, error)
        }
      }

      // Import preferences
      if (importData.preferences) {
        localStorage.setItem('glance-money-preferences', JSON.stringify(importData.preferences))
      }

      toast.success('Import Successful', {
        description: `Imported ${importedTransactions} transactions and ${importedGoals} goals.`,
      })

      // Refresh the page to apply imported preferences
      window.location.reload()
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Import Failed', {
        description: 'Failed to import data. Please check the file format.',
      })
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Export Section */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium">{t('exportData')}</h4>
              <p className="text-sm text-muted-foreground">
                Download all your transactions, goals, and preferences as a JSON file.
              </p>
            </div>
            <Button 
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : t('exportData')}
            </Button>
          </div>

          {/* Import Section */}
          <div className="space-y-3 border-t pt-6">
            <div>
              <h4 className="text-sm font-medium">{t('importData')}</h4>
              <p className="text-sm text-muted-foreground">
                Import data from a previously exported JSON file.
              </p>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                Warning: Importing will add new data to your existing records. Duplicate entries may be created.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                disabled={isImporting}
                className="hidden"
                id="import-file"
              />
              <Button 
                asChild
                variant="outline"
                disabled={isImporting}
                className="w-full sm:w-auto"
              >
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importing...' : t('importData')}
                </label>
              </Button>
            </div>
          </div>

          {/* Data Info */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium mb-2">Data Information</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Export includes all transactions, goals, and app preferences</p>
              <p>• Import supports JSON files from Glance Money exports</p>
              <p>• Data is stored locally and synced with your Supabase account</p>
              <p>• Regular exports are recommended for backup purposes</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}