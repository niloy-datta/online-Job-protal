const base = 'http://localhost:4000/api'
const ts = Date.now()
const recruiterEmail = `recruiter_must_${ts}@example.com`
const seekerEmail = `seeker_must_${ts}@example.com`
const pass = '123'

async function parseJson(response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

async function main() {
  const recruiterRegister = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Account Name Visible',
      email: recruiterEmail,
      password: pass,
      role: 'employer',
    }),
  })

  if (!recruiterRegister.ok) {
    console.log('recruiter register fail', recruiterRegister.status, await recruiterRegister.text())
    return
  }

  const recruiterLoginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: recruiterEmail, password: pass, role: 'employer' }),
  })
  const recruiterLogin = await parseJson(recruiterLoginRes)

  if (!recruiterLoginRes.ok) {
    console.log('recruiter login fail', recruiterLoginRes.status, recruiterLogin)
    return
  }

  const recruiterToken = recruiterLogin.token

  const jobRes = await fetch(`${base}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${recruiterToken}`,
    },
    body: JSON.stringify({
      title: `Must Name Email ${ts}`,
      company: 'Must Co',
      location: 'Dhaka',
      salary: '50000',
      type: 'Full-time',
      description: 'must test',
    }),
  })
  const job = await parseJson(jobRes)

  if (!jobRes.ok) {
    console.log('job create fail', jobRes.status, job)
    return
  }

  const seekerRegister = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Applied Account Name',
      email: seekerEmail,
      password: pass,
      role: 'job_seeker',
    }),
  })

  if (!seekerRegister.ok) {
    console.log('seeker register fail', seekerRegister.status, await seekerRegister.text())
    return
  }

  const seekerLoginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: seekerEmail, password: pass, role: 'job_seeker' }),
  })
  const seekerLogin = await parseJson(seekerLoginRes)

  if (!seekerLoginRes.ok) {
    console.log('seeker login fail', seekerLoginRes.status, seekerLogin)
    return
  }

  const seekerToken = seekerLogin.token
  const seekerId = seekerLogin.user.id

  const saveProfileRes = await fetch(`${base}/profiles/${seekerId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${seekerToken}`,
    },
    body: JSON.stringify({
      fullName: 'Different Profile Name',
      email: `different.profile.${ts}@gmail.com`,
      phone: '01700000000',
      location: 'Rajshahi',
      resumeFile: null,
      profileCompletion: 100,
      education: [{ degree: 'BSc', institute: 'RU', year: '2025' }],
      skills: ['JS'],
      experience: [{ role: 'Intern', company: 'Co', period: '4 months' }],
    }),
  })

  if (!saveProfileRes.ok) {
    console.log('profile save fail', saveProfileRes.status, await saveProfileRes.text())
    return
  }

  const applyRes = await fetch(`${base}/jobs/${job.job.id}/apply`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${seekerToken}` },
  })

  if (!applyRes.ok) {
    console.log('apply fail', applyRes.status, await applyRes.text())
    return
  }

  const appsRes = await fetch(`${base}/jobs/recruiter/applications`, {
    headers: { Authorization: `Bearer ${recruiterToken}` },
  })
  const apps = await parseJson(appsRes)

  if (!appsRes.ok) {
    console.log('apps fail', appsRes.status, apps)
    return
  }

  const row = (apps.applications || []).find((item) => item.job_id === job.job.id)
  console.log(
    JSON.stringify(
      {
        shownApplicantName: row?.applicant_name,
        shownApplicantEmail: row?.applicant_email,
        profileName: row?.applicant_profile_name,
        profileEmail: row?.applicant_profile_email,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
})
