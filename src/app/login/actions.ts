'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error(`[AUTH][LOGIN] Failed: ${error.message}`);
    return { error: error.message }
  }

  // Check user role
  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', data.user.id)
    .limit(1)
    .single()

  let redirectUrl = '/admin'
  if (member && member.role === 'employee') {
    redirectUrl = '/employee'
  }

  revalidatePath('/', 'layout')
  redirect(redirectUrl)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    console.error(`[AUTH][SIGNUP] Failed: ${error.message}`);
    return { error: error.message }
  }

  // Check user role
  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', data.user.id)
    .limit(1)
    .single()

  let redirectUrl = '/admin'
  if (member && member.role === 'employee') {
    redirectUrl = '/employee'
  }

  revalidatePath('/', 'layout')
  redirect(redirectUrl)
}
