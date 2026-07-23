export function memberById(db, id) {
  return db.members.find((m) => m.id === id)
}

export function memberName(db, id) {
  return memberById(db, id)?.name || '알 수 없음'
}

// 업로드 사진을 최대 1000px, JPEG 75%로 압축해 용량을 줄인다.
export async function compressImage(file) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = URL.createObjectURL(file)
  })
  const max = 1000
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * scale)
  c.height = Math.round(img.height * scale)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  URL.revokeObjectURL(img.src)
  return c.toDataURL('image/jpeg', 0.75)
}
