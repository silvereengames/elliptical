import { v4 as uuid } from "uuid"

import { context } from "@/store"

export const notif = (content, options = {}) => {
  options = {
    expires: 5,
    status: 0,
    ...options,
  }

  const id = uuid()

  context.notif.status = options.status
  context.notif.text = content
  context.notif.showing = true
  context.notif.id = id

  if (options.expires !== 0)
    setTimeout(() => {
      if (context.notif.id === id) context.notif.showing = false
    }, options.expires * 1000)

  return {
    hide: hideNotif,
  }
}

export const hideNotif = () => {
  context.notif.showing = false
  context.notif.status = 0
  context.notif.text = ""
}
