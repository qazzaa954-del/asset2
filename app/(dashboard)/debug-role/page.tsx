'use client'

import { useAuth } from '@/app/providers'
import { Card } from '@/components/ui/Card'

export default function DebugRolePage() {
  const { userProfile, user, loading } = useAuth()

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-4">
      <Card>
        <h1 className="text-2xl font-bold mb-4">Debug Role Information</h1>
        
        <div className="space-y-3">
          <div>
            <strong>User (Auth):</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <div>
            <strong>User Profile:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">
              {JSON.stringify(userProfile, null, 2)}
            </pre>
          </div>

          <div>
            <strong>Role Check:</strong>
            <div className="mt-2 space-y-1">
              <p>Raw role: <code className="bg-gray-100 px-2 py-1 rounded">"{userProfile?.role}"</code></p>
              <p>Trimmed role: <code className="bg-gray-100 px-2 py-1 rounded">"{userProfile?.role?.trim()}"</code></p>
              <p>Is Master Admin (exact): <code className="bg-gray-100 px-2 py-1 rounded">{String(userProfile?.role === 'Master Admin')}</code></p>
              <p>Is Master Admin (trimmed): <code className="bg-gray-100 px-2 py-1 rounded">{String(userProfile?.role?.trim() === 'Master Admin')}</code></p>
            </div>
          </div>

          <div>
            <strong>Role Length:</strong>
            <p>Raw: {userProfile?.role?.length || 0} characters</p>
            <p>Trimmed: {userProfile?.role?.trim()?.length || 0} characters</p>
          </div>

          <div>
            <strong>Character Codes:</strong>
            <p className="text-xs font-mono">
              {userProfile?.role?.split('').map((char, i) => `${char}(${char.charCodeAt(0)})`).join(' ')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

