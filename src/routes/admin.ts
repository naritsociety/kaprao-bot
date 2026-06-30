import { Elysia } from 'elysia'
import { getRichMenuListInfo, setupRichMenu } from '../services/richMenu'

export const adminRoutes = new Elysia()
  .get('/admin/setup-richmenu', async () => {
    try {
      const richMenuId = await setupRichMenu()
      return {
        ok: true,
        message: 'Rich menu setup completed successfully',
        richMenuId
      }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
  .get('/admin/richmenus', async () => {
    try {
      const richmenus = await getRichMenuListInfo()
      return {
        ok: true,
        richmenus
      }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })