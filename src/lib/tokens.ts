import { v4 as uuidv4 } from 'uuid'
import prisma from './prisma'

export async function generateVerificationToken(email: string) {
  const token = uuidv4()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  // Create new token
  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  return verificationToken
}

export async function getVerificationToken(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  return verificationToken
}

export async function deleteVerificationToken(token: string) {
  await prisma.verificationToken.delete({
    where: { token },
  })
}
