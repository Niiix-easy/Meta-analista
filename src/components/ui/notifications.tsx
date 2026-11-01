"use client"

import * as React from "react"
import { Bell, Info, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover"
import { cn } from "@/src/lib/utils"

export interface Notification {
  id: string
  title: string
  description: string
  time: string
  type: 'info' | 'alert' | 'success'
  read: boolean
}

export function NotificationBell({ 
  notifications, 
  setNotifications 
}: { 
  notifications: Notification[],
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>
}) {
  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h4 className="text-sm font-semibold">Notificações</h4>
          <Button variant="ghost" size="sm" className="text-[10px] h-auto p-0" onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
            Marcar todas como lidas
          </Button>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Nenhuma notificação</div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                className={cn(
                  "flex items-start gap-3 border-b p-4 last:border-0 hover:bg-muted/50 cursor-pointer",
                  !n.read && "bg-primary/5"
                )}
                onClick={() => markAsRead(n.id)}
              >
                <div className="mt-0.5">
                  {n.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                  {n.type === 'alert' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  {n.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-semibold leading-none">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{n.description}</p>
                  <p className="text-[10px] text-muted-foreground/60">{n.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
