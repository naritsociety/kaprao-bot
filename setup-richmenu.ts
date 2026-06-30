import 'dotenv/config' // โหลดค่า .env เข้ามาใน process.env
import { setupRichMenu } from './src/services/richMenu'

async function main() {
  console.log('🚀 กำลังเริ่มสร้าง Rich Menu...')
  console.log('📂 กำลังค้นหารูปภาพ rich-menu.png...')
  
  try {
    const richMenuId = await setupRichMenu()
    console.log('✅ สร้างและตั้งค่า Rich Menu สำเร็จเรียบร้อย!')
    console.log('🎨 Rich Menu ID:', richMenuId)
    console.log('\n💡 ลองเปิด LINE OA ดูเลยครับ ลูกค้าจะเห็นเมนูด้านล่างแล้ว!')
    process.exit(0)
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error)
    process.exit(1)
  }
}

main()