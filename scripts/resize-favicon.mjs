import sharp from 'sharp'

const inputPath = './src/assets/img/facivicon.png'
const outputPath = './public/facivicon.png'

try {
  const metadata = await sharp(inputPath).metadata()
  const newWidth = Math.round(metadata.width * 1.3)
  const newHeight = Math.round(metadata.height * 1.3)

  console.log(`Original: ${metadata.width}x${metadata.height}`)
  console.log(`New: ${newWidth}x${newHeight}`)

  await sharp(inputPath)
    .resize(newWidth, newHeight, {
      kernel: sharp.kernel.lanczos3
    })
    .toFile(outputPath)

  console.log('✅ Favicon resized successfully!')
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
