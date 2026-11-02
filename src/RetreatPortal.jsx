import { useEffect, useState } from 'react'
import { requestApi } from './retreatApi'
import './RetreatPortal.css'

const EMPTY_REGISTRATION = {
  name: '',
  middleName: '',
  surname: '',
  role: 'visitor',
  mobileNumber: '',
  email: '',
  center: '',
  centerPayment: '',
  address: '',
}

const ROLE_LABELS = {
  visitor: 'Visitor',
  organizer: 'Organizer',
  admin: 'Admin',
}

function RegistrationPage({ token, onLogout, onRefreshAccount }) {
  const [retreats, setRetreats] = useState([])
  const [selectedRetreatId, setSelectedRetreatId] = useState('')
  const [retreatError, setRetreatError] = useState('')
  const [registration, setRegistration] = useState(EMPTY_REGISTRATION)
  const [registrationMessage, setRegistrationMessage] = useState('')
  const [registrationError, setRegistrationError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    requestApi('/api/retreats', { signal: controller.signal }, token)
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Retreat list response is not valid.')
        setRetreats(data)
        setSelectedRetreatId(data[0]?._id || '')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        if (error.status === 401) {
          onLogout()
          window.location.hash = '#organization'
        } else {
          if (error.status === 403) {
            onRefreshAccount().catch((refreshError) => setRetreatError(refreshError.message))
          }
          setRetreatError(error.message)
        }
      })
    return () => controller.abort()
  }, [onLogout, onRefreshAccount, token])

  const updateRegistration = (field, value) => {
    setRegistration((current) => ({ ...current, [field]: value }))
  }

  const submitRegistration = async (event) => {
    event.preventDefault()
    setRegistrationError('')
    setRegistrationMessage('')
    setSubmitting(true)
    try {
      await requestApi(`/api/retreats/${encodeURIComponent(selectedRetreatId)}/registrations`, {
        method: 'POST',
        body: JSON.stringify(registration),
      }, token)
      setRegistration({ ...EMPTY_REGISTRATION })
      setRegistrationMessage('नोंदणी यशस्वी झाली. धन्यवाद!')
    } catch (error) {
      if (error.status === 401) {
        onLogout()
        window.location.hash = '#organization'
      } else {
        if (error.status === 403) {
          onRefreshAccount().catch((refreshError) => setRegistrationError(refreshError.message))
        }
        setRegistrationError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="retreat-page">
      <header className="retreat-page-heading">
        <p>त्रिरत्न बौद्ध महासंघ · अकोला</p>
        <h1>धम्मक्रांती शिबिर नोंदणी</h1>
        <span>शिबिर निवडा आणि सहभागी होण्यासाठी खालील माहिती भरा.</span>
      </header>

      <section className="retreat-card" aria-labelledby="registration-title">
        <div className="retreat-card-heading">
          <div>
            <span className="retreat-card-kicker">RETREAT REGISTRATION</span>
            <h2 id="registration-title">सहभागी नोंदणी</h2>
          </div>
        </div>

        {retreatError && <p className="retreat-feedback is-error" role="alert">{retreatError}</p>}

        <form className="registration-form" onSubmit={submitRegistration}>
          <label className="registration-field registration-field-wide">
            शिबिर निवडा
            <select required value={selectedRetreatId} onChange={(event) => setSelectedRetreatId(event.target.value)} disabled={!retreats.length}>
              <option value="" disabled>{retreats.length ? 'शिबिर निवडा' : 'शिबिर उपलब्ध नाही'}</option>
              {retreats.map((retreat) => (
                <option key={retreat._id} value={retreat._id}>{retreat.name} · {retreat.year}</option>
              ))}
            </select>
          </label>
          <label>
            नाव
            <input required autoComplete="given-name" value={registration.name} onChange={(event) => updateRegistration('name', event.target.value)} maxLength={100} />
          </label>
          <label>
            मधले नाव <span>(ऐच्छिक)</span>
            <input autoComplete="additional-name" value={registration.middleName} onChange={(event) => updateRegistration('middleName', event.target.value)} maxLength={100} />
          </label>
          <label>
            नोंदणीचा प्रकार
            <select value={registration.role} disabled>
              <option value="visitor">Visitor</option>
            </select>
          </label>
          <label>
            आडनाव
            <input required autoComplete="family-name" value={registration.surname} onChange={(event) => updateRegistration('surname', event.target.value)} maxLength={100} />
          </label>
          <label>
            मोबाईल नंबर
            <input required type="tel" autoComplete="tel" value={registration.mobileNumber} onChange={(event) => updateRegistration('mobileNumber', event.target.value)} maxLength={30} />
          </label>
          <label>
            ईमेल <span>(ऐच्छिक)</span>
            <input type="email" autoComplete="email" value={registration.email} onChange={(event) => updateRegistration('email', event.target.value)} maxLength={160} />
          </label>
          <label>
            केंद्र
            <input required value={registration.center} onChange={(event) => updateRegistration('center', event.target.value)} maxLength={100} />
          </label>
          <label>
            केंद्र शुल्क / पेमेंट
            <input required value={registration.centerPayment} onChange={(event) => updateRegistration('centerPayment', event.target.value)} maxLength={100} />
          </label>
          <label className="registration-field-wide">
            पूर्ण पत्ता
            <textarea required autoComplete="street-address" rows="3" value={registration.address} onChange={(event) => updateRegistration('address', event.target.value)} maxLength={500} />
          </label>

          {registrationError && <p className="retreat-feedback is-error registration-field-wide" role="alert">{registrationError}</p>}
          {registrationMessage && <p className="retreat-feedback is-success registration-field-wide" role="status">{registrationMessage}</p>}

          <div className="registration-submit registration-field-wide">
            <p>तुमची माहिती निवडलेल्या शिबिराच्या नोंदणीसाठी वापरली जाईल.</p>
            <button type="submit" className="retreat-primary-button" disabled={!selectedRetreatId || submitting}>
              {submitting ? 'नोंदणी होत आहे…' : 'नोंदणी सबमिट करा'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isSignup = mode === 'signup'

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (isSignup && password !== confirmation) {
      setError('दोन्ही पासवर्ड जुळत नाहीत.')
      return
    }

    setSubmitting(true)
    try {
      const result = await requestApi(`/api/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(isSignup ? { name, email, password } : { email, password }),
      })
      onAuthenticated(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="retreat-card auth-card" aria-labelledby="auth-title">
      <div className="retreat-card-heading">
        <div>
          <span className="retreat-card-kicker">ORGANIZER PORTAL</span>
          <h2 id="auth-title">{isSignup ? 'नवीन खाते तयार करा' : 'व्यवस्थापन लॉगिन'}</h2>
        </div>
      </div>
      <div className="auth-mode-switch" role="group" aria-label="लॉगिन किंवा साइन अप">
        <button type="button" className={!isSignup ? 'is-selected' : ''} aria-pressed={!isSignup} onClick={() => { setMode('login'); setError('') }}>लॉगिन</button>
        <button type="button" className={isSignup ? 'is-selected' : ''} aria-pressed={isSignup} onClick={() => { setMode('signup'); setError('') }}>साइन अप</button>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {isSignup && (
          <label>
            पूर्ण नाव
            <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
          </label>
        )}
        <label>
          ईमेल
          <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} />
        </label>
        <label>
          पासवर्ड
          <input required type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={isSignup ? 8 : undefined} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} />
          {isSignup && <small>किमान ८ अक्षरे आवश्यक.</small>}
        </label>
        {isSignup && (
          <label>
            पासवर्ड पुन्हा लिहा
            <input required type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
        )}
        {error && <p className="retreat-feedback is-error" role="alert">{error}</p>}
        <button type="submit" className="retreat-primary-button auth-submit" disabled={submitting}>
          {submitting ? 'कृपया थांबा…' : isSignup ? 'Visitor खाते तयार करा' : 'लॉगिन करा'}
        </button>
      </form>

      <p className="auth-security-note">
        सार्वजनिक साइन-अपने Visitor खाते तयार होते. Admin खाते फक्त server वरच्या `ADMIN_EMAIL` आणि `ADMIN_PASSWORD` मधून तयार करा. Admin नंतर खाते Organizer किंवा Admin म्हणून नेमू शकतो.
      </p>
    </section>
  )
}

function AccountProfile({ account }) {
  return (
    <section className="retreat-card account-profile-card" aria-labelledby="account-profile-title">
      <div className="retreat-card-heading">
        <div>
          <span className="retreat-card-kicker">SIGNED-IN ACCOUNT</span>
          <h2 id="account-profile-title">तुमची प्रोफाइल माहिती</h2>
        </div>
        <span className="profile-role-badge">{ROLE_LABELS[account.role] || account.role}</span>
      </div>
      <dl className="account-profile-details">
        <div><dt>पूर्ण नाव</dt><dd>{account.name}</dd></div>
        <div><dt>ईमेल</dt><dd>{account.email}</dd></div>
        <div><dt>खाते ID</dt><dd>{account._id}</dd></div>
      </dl>
    </section>
  )
}

function ApprovalNotice({ account, onLogout, onRefreshAccount }) {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const checkApproval = async () => {
    setChecking(true)
    setError('')
    try {
      await onRefreshAccount()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="approval-notice-stack">
      <AccountProfile account={account} />
      <section className="retreat-card people-private-notice approval-notice" role="status">
        <span aria-hidden="true">◷</span>
        <h2>Waiting for admin approval</h2>
        <p>
          Your request has been sent to the admin. Please log in again after some
          time to check whether your account has been approved as an Organizer.
        </p>
        {error && <p className="retreat-feedback is-error" role="alert">{error}</p>}
        <div className="approval-notice-actions">
          <button type="button" className="retreat-primary-button" disabled={checking} onClick={checkApproval}>
            {checking ? 'तपासत आहे…' : 'मंजुरी तपासा'}
          </button>
          <button type="button" className="retreat-secondary-button" onClick={onLogout}>लॉग आउट</button>
        </div>
      </section>
    </div>
  )
}

function RoleManager({ token, account, onLogout, onRefreshAccount, onAccountsChanged }) {
  const [accounts, setAccounts] = useState([])
  const [waitingAccounts, setWaitingAccounts] = useState([])
  const [roles, setRoles] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [approvingId, setApprovingId] = useState('')
  const [resettingId, setResettingId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      requestApi('/api/accounts', { signal: controller.signal }, token),
      requestApi('/api/accounts/waiting', { signal: controller.signal }, token),
    ])
      .then(([allAccounts, waiting]) => {
        if (!Array.isArray(allAccounts) || !Array.isArray(waiting)) {
          throw new Error('Account list response is not valid.')
        }
        setAccounts(allAccounts)
        setWaitingAccounts(waiting)
        setRoles(Object.fromEntries(allAccounts.map((entry) => [entry._id, entry.role])))
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        if (requestError.status === 401) onLogout()
        else setError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [token, onLogout])

  const approveOrganizer = async (target) => {
    setError('')
    setMessage('')
    setApprovingId(target._id)
    try {
      const updated = await requestApi(`/api/accounts/${encodeURIComponent(target._id)}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: 'organizer' }),
      }, token)
      setWaitingAccounts((current) => current.filter((entry) => entry._id !== updated._id))
      setAccounts((current) => current.map((entry) => entry._id === updated._id ? updated : entry))
      setRoles((current) => ({ ...current, [updated._id]: updated.role }))
      setMessage(`${updated.name} यांना Organizer म्हणून मंजुरी दिली.`)
      onAccountsChanged()
    } catch (requestError) {
      if (requestError.status === 401) onLogout()
      else setError(requestError.message)
    } finally {
      setApprovingId('')
    }
  }

  const updateRole = async (target) => {
    setError('')
    setMessage('')
    setSavingId(target._id)
    try {
      const updated = await requestApi(`/api/accounts/${encodeURIComponent(target._id)}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: roles[target._id] }),
      }, token)
      setAccounts((current) => current.map((entry) => entry._id === updated._id ? updated : entry))
      setWaitingAccounts((current) => updated.role === 'visitor'
        ? [updated, ...current.filter((entry) => entry._id !== updated._id)]
        : current.filter((entry) => entry._id !== updated._id))
      setMessage(`${updated.name} यांची भूमिका ${ROLE_LABELS[updated.role]} केली.`)
      onAccountsChanged()
      await onRefreshAccount()
    } catch (requestError) {
      if (requestError.status === 401) onLogout()
      else setError(requestError.message)
    } finally {
      setSavingId('')
    }
  }

  const resetPassword = async (event, target) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setPasswordBusy(true)
    try {
      await requestApi(`/api/accounts/${encodeURIComponent(target._id)}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPassword }),
      }, token)
      setMessage(`${target.name} यांचा पासवर्ड बदलला. त्यांनी पुन्हा लॉगिन करणे आवश्यक आहे.`)
      setNewPassword('')
      setResettingId('')
      if (target._id === account._id) onLogout()
    } catch (requestError) {
      if (requestError.status === 401) onLogout()
      else setError(requestError.message)
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <section className="retreat-card account-card" id="account-access" aria-labelledby="accounts-title">
      <div className="retreat-card-heading">
        <div>
          <span className="retreat-card-kicker">ACCOUNT ACCESS</span>
          <h2 id="accounts-title">खाते आणि भूमिका</h2>
        </div>
      </div>
      <p className="people-privacy-note">नवीन साइन-अप Visitor म्हणून येतात. Retreat, सहभागी यादी आणि भूमिका व्यवस्थापनासाठी Admin आवश्यक आहे.</p>
      {error && <p className="retreat-feedback is-error" role="alert">{error}</p>}
      {message && <p className="retreat-feedback is-success" role="status">{message}</p>}
      <section className="waiting-approval-section" id="waiting-approval" aria-labelledby="waiting-approval-title">
        <div className="waiting-approval-heading">
          <h3 id="waiting-approval-title">Waiting for admin approval</h3>
          <span>{waitingAccounts.length}</span>
        </div>
        {loading ? (
          <p className="people-empty">मंजुरीसाठी खाती लोड होत आहेत…</p>
        ) : waitingAccounts.length ? (
          <div className="waiting-approval-list">
            {waitingAccounts.map((entry) => (
              <div className="waiting-approval-row" key={entry._id}>
                <div className="account-identity">
                  <strong>{entry.name}</strong>
                  <span>{entry.email}</span>
                </div>
                <button
                  type="button"
                  className="retreat-primary-button"
                  disabled={approvingId === entry._id || savingId === entry._id}
                  onClick={() => approveOrganizer(entry)}
                >
                  {approvingId === entry._id ? 'मंजुरी देत आहे…' : 'Organizer मंजूर करा'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="people-empty">मंजुरीसाठी कोणतेही Visitor खाते नाही.</p>
        )}
      </section>
      {loading ? (
        <p className="people-empty">खाती लोड होत आहेत…</p>
      ) : accounts.length ? (
        <div className="account-list">
          {accounts.map((entry) => (
            <div className="account-row" key={entry._id}>
              <div className="account-identity">
                <strong>{entry.name}</strong>
                <span>{entry.email}</span>
                {entry._id === account._id && <small>तुमचे खाते</small>}
              </div>
              <select
                aria-label={`${entry.name} role`}
                value={roles[entry._id]}
                disabled={entry._id === account._id || savingId === entry._id || approvingId === entry._id}
                onChange={(event) => setRoles((current) => ({ ...current, [entry._id]: event.target.value }))}
              >
                {Object.entries(ROLE_LABELS).map(([role, label]) => <option value={role} key={role}>{label}</option>)}
              </select>
              <button
                type="button"
                className="retreat-secondary-button"
                disabled={entry._id === account._id || roles[entry._id] === entry.role || savingId === entry._id || approvingId === entry._id}
                onClick={() => updateRole(entry)}
              >
                {savingId === entry._id ? 'जतन…' : 'भूमिका जतन करा'}
              </button>
              <button
                type="button"
                className="account-password-toggle"
                aria-expanded={resettingId === entry._id}
                onClick={() => {
                  setResettingId((current) => current === entry._id ? '' : entry._id)
                  setNewPassword('')
                }}
              >
                {resettingId === entry._id ? 'पासवर्ड फॉर्म बंद करा' : 'पासवर्ड बदला'}
              </button>
              {resettingId === entry._id && (
                <form className="account-password-form" onSubmit={(event) => resetPassword(event, entry)}>
                  <label>
                    नवीन पासवर्ड
                    <input
                      required
                      type="password"
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <small>किमान ८ अक्षरे; बदलानंतर खाते पुन्हा लॉगिन करेल.</small>
                  </label>
                  <button type="submit" className="retreat-primary-button" disabled={passwordBusy}>
                    {passwordBusy ? 'बदलत आहे…' : 'पासवर्ड जतन करा'}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="people-empty">खाते उपलब्ध नाहीत.</p>
      )}
    </section>
  )
}

function CreateRetreat({ token, onLogout, onRefreshAccount }) {
  const [retreats, setRetreats] = useState([])
  const [loadingRetreats, setLoadingRetreats] = useState(true)
  const [deletingId, setDeletingId] = useState('')
  const [listError, setListError] = useState('')
  const [name, setName] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    requestApi('/api/retreats', { signal: controller.signal }, token)
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Retreat list response is not valid.')
        setRetreats(data)
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        if (requestError.status === 401) onLogout()
        else {
          if (requestError.status === 403) {
            onRefreshAccount().catch((refreshError) => setListError(refreshError.message))
          }
          setListError(requestError.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRetreats(false)
      })
    return () => controller.abort()
  }, [onLogout, onRefreshAccount, token])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      const retreat = await requestApi('/api/retreats', {
        method: 'POST',
        body: JSON.stringify({ name, year: Number(year) }),
      }, token)
      setName('')
      setRetreats((current) => [...current, retreat].sort((first, second) => (
        second.year - first.year || first.name.localeCompare(second.name)
      )))
      setMessage(`${retreat.name} · ${retreat.year} शिबिर तयार झाले.`)
    } catch (requestError) {
      if (requestError.status === 401) onLogout()
      else {
        if (requestError.status === 403) {
          onRefreshAccount().catch((refreshError) => setError(refreshError.message))
        }
        setError(requestError.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const deleteRetreat = async (retreat) => {
    if (!window.confirm(`${retreat.name} · ${retreat.year} आणि त्यातील सर्व सहभागी नोंदणी कायमच्या हटवायच्या आहेत का? ही कृती पूर्ववत करता येणार नाही.`)) return

    setListError('')
    setMessage('')
    setDeletingId(retreat._id)
    try {
      await requestApi(`/api/retreats/${encodeURIComponent(retreat._id)}`, { method: 'DELETE' }, token)
      setRetreats((current) => current.filter((entry) => entry._id !== retreat._id))
      setMessage(`${retreat.name} · ${retreat.year} शिबिर आणि त्यातील नोंदणी हटवली.`)
    } catch (requestError) {
      if (requestError.status === 401) onLogout()
      else {
        if (requestError.status === 403) {
          onRefreshAccount().catch((refreshError) => setListError(refreshError.message))
        }
        setListError(requestError.message)
      }
    } finally {
      setDeletingId('')
    }
  }

  return (
    <section className="retreat-card create-retreat-card" id="retreat-setup" aria-labelledby="create-retreat-title">
      <div className="retreat-card-heading">
        <div>
          <span className="retreat-card-kicker">RETREAT SETUP</span>
          <h2 id="create-retreat-title">नवीन शिबिर</h2>
        </div>
      </div>
      <form className="retreat-create-form" onSubmit={submit}>
        <label>
          शिबिराचे नाव
          <input required value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
        </label>
        <label>
          वर्ष
          <input required type="number" min="2000" step="1" value={year} onChange={(event) => setYear(event.target.value)} />
        </label>
        <button type="submit" className="retreat-primary-button" disabled={submitting}>
          {submitting ? 'जतन होत आहे…' : 'शिबिर तयार करा'}
        </button>
      </form>
      {error && <p className="retreat-feedback is-error" role="alert">{error}</p>}
      {message && <p className="retreat-feedback is-success" role="status">{message}</p>}
      <div className="retreat-admin-list">
        <h3>उपलब्ध शिबिरे</h3>
        {listError && <p className="retreat-feedback is-error" role="alert">{listError}</p>}
        {loadingRetreats ? (
          <p className="people-empty">शिबिरे लोड होत आहेत…</p>
        ) : retreats.length ? (
          <ul>
            {retreats.map((retreat) => (
              <li key={retreat._id}>
                <span><strong>{retreat.name}</strong><small>{retreat.year}</small></span>
                <button
                  type="button"
                  className="people-delete-button"
                  disabled={deletingId === retreat._id}
                  onClick={() => deleteRetreat(retreat)}
                >
                  {deletingId === retreat._id ? 'हटवत आहे…' : 'शिबिर व नोंदणी हटवा'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="people-empty">सध्या कोणतेही शिबिर उपलब्ध नाही.</p>
        )}
      </div>
    </section>
  )
}

function AdminDashboard({ account, token, onLogout, onRefreshAccount, refreshKey }) {
  const [summary, setSummary] = useState({ registrations: 0, accounts: [], retreats: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      requestApi('/api/users', { signal: controller.signal }, token),
      requestApi('/api/accounts', { signal: controller.signal }, token),
      requestApi('/api/retreats', { signal: controller.signal }, token),
    ])
      .then(([registrations, accounts, retreats]) => {
        if (!Array.isArray(registrations) || !Array.isArray(accounts) || !Array.isArray(retreats)) {
          throw new Error('Dashboard summary response is not valid.')
        }
        setSummary({ registrations: registrations.length, accounts, retreats: retreats.length })
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        if (requestError.status === 401) onLogout()
        else {
          if (requestError.status === 403) {
            onRefreshAccount().catch((refreshError) => setError(refreshError.message))
          }
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [onLogout, onRefreshAccount, refreshKey, token])

  const organizerCount = summary.accounts.filter((entry) => entry.role === 'organizer').length
  const waitingCount = summary.accounts.filter((entry) => entry.role === 'visitor').length

  return (
    <>
      <section className="admin-welcome-panel">
        <div className="admin-welcome-copy">
          <span className="admin-welcome-kicker">TRIRATNA AKOLA · ADMIN CONSOLE</span>
          <h2>नमस्कार, {account.name}</h2>
          <p>शिबिर, सहभागी आणि व्यवस्थापन खात्यांचे एकाच ठिकाणी नियंत्रण.</p>
        </div>
        <div className="admin-welcome-actions">
          <span className="admin-account-badge"><span aria-hidden="true">✦</span> Admin</span>
          <button type="button" className="retreat-secondary-button" onClick={onLogout}>लॉग आउट</button>
        </div>
      </section>
      <AccountProfile account={account} />

      <section className="admin-summary-grid" aria-label="व्यवस्थापन सारांश">
        <article className="admin-summary-card">
          <span className="admin-summary-icon" aria-hidden="true">☷</span>
          <div><small>एकूण सहभागी</small><strong>{loading ? '…' : summary.registrations}</strong></div>
          <a href="#people" aria-label="सहभागी यादी उघडा">यादी पहा ↗</a>
        </article>
        <article className="admin-summary-card">
          <span className="admin-summary-icon" aria-hidden="true">◎</span>
          <div><small>व्यवस्थापन खाती</small><strong>{loading ? '…' : summary.accounts.length}</strong></div>
          <a href="#account-access" aria-label="खाते व्यवस्थापन उघडा">खाती पहा ↓</a>
        </article>
        <article className="admin-summary-card">
          <span className="admin-summary-icon" aria-hidden="true">♧</span>
          <div><small>Organizer</small><strong>{loading ? '…' : organizerCount}</strong></div>
          <a href="#account-access" aria-label="Organizer खाती व्यवस्थापित करा">व्यवस्थापित करा ↓</a>
        </article>
        <article className="admin-summary-card">
          <span className="admin-summary-icon" aria-hidden="true">☸</span>
          <div><small>शिबिरे</small><strong>{loading ? '…' : summary.retreats}</strong></div>
          <a href="#retreat-setup" aria-label="शिबिरे व्यवस्थापित करा">शिबिर व्यवस्थापन ↓</a>
        </article>
        <article className="admin-summary-card admin-pending-summary">
          <span className="admin-summary-icon" aria-hidden="true">◷</span>
          <div><small>मंजुरी बाकी</small><strong>{loading ? '…' : waitingCount}</strong></div>
          <a href="#waiting-approval" aria-label="मंजुरीसाठी प्रलंबित खाती पहा">मंजुरी queue ↓</a>
        </article>
      </section>

      {error && <p className="retreat-feedback is-error" role="alert">{error}</p>}
      <div className="admin-quick-actions">
        <a className="admin-quick-link" href="#waiting-approval"><span aria-hidden="true">◷</span><span><strong>प्रलंबित मंजुरी <em>{loading ? '…' : waitingCount}</em></strong><small>Visitor खात्यांना Organizer मंजुरी द्या</small></span><b>→</b></a>
        <a className="admin-quick-link" href="#retreat-setup"><span aria-hidden="true">☸</span><span><strong>शिबिर व्यवस्थापन</strong><small>शिबिर तयार करा किंवा हटवा</small></span><b>→</b></a>
        <a className="admin-quick-link" href="#people"><span aria-hidden="true">☷</span><span><strong>सहभागी यादी</strong><small>नोंदणी पहा किंवा हटवा</small></span><b>→</b></a>
        <a className="admin-quick-link" href="#account-access"><span aria-hidden="true">◎</span><span><strong>खाते व्यवस्थापन</strong><small>भूमिका आणि पासवर्ड व्यवस्थापित करा</small></span><b>→</b></a>
      </div>
    </>
  )
}

function OrganizationPage({ account, token, authLoading, onAuthenticated, onLogout, onRefreshAccount }) {
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0)

  return (
    <main className="retreat-page organization-page">
      <header className="retreat-page-heading">
        <p>त्रिरत्न बौद्ध महासंघ · अकोला</p>
        <h1>{account?.role === 'admin' ? 'Admin Dashboard' : 'संघटन व्यवस्थापन'}</h1>
        <span>{account?.role === 'admin' ? 'शिबिर व्यवस्थापन आणि प्रशासकीय नियंत्रण.' : 'Admin आणि Organizer खात्यांसाठी सुरक्षित प्रवेश.'}</span>
      </header>
      {authLoading ? (
        <section className="retreat-card people-empty" role="status">खाते तपासत आहोत…</section>
      ) : !account ? (
        <AuthForm onAuthenticated={onAuthenticated} />
      ) : (
        <>
          {account.role === 'admin' ? (
          <>
            <AdminDashboard account={account} token={token} onLogout={onLogout} onRefreshAccount={onRefreshAccount} refreshKey={dashboardRefreshKey} />
            <CreateRetreat token={token} onLogout={onLogout} onRefreshAccount={onRefreshAccount} />
            <RoleManager
              token={token}
              account={account}
              onLogout={onLogout}
              onRefreshAccount={onRefreshAccount}
              onAccountsChanged={() => setDashboardRefreshKey((current) => current + 1)}
            />
          </>
          ) : (
          account.role === 'organizer' ? (
          <>
            <AccountProfile account={account} />
            <section className="retreat-card role-notice">
              <h2>Organizer प्रवेश सक्रिय आहे</h2>
              <p>तुम्ही सहभागी नोंदणी करू शकता आणि सहभागींची यादी पाहू शकता. शिबिरे तयार करणे, हटवणे आणि खाते भूमिका बदलणे Admin साठी राखीव आहे.</p>
              <div className="organizer-actions">
                <a className="retreat-primary-button" href="#registration">सहभागी नोंदणी</a>
                <a className="retreat-secondary-button" href="#people">सहभागी यादी</a>
              </div>
            </section>
          </>
          ) : (
            <ApprovalNotice account={account} onLogout={onLogout} onRefreshAccount={onRefreshAccount} />
          )
          )}
        </>
      )}
    </main>
  )
}

function PeoplePage({ account, token, authLoading, onLogout, onRefreshAccount }) {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')

  useEffect(() => {
    if (!token || !['admin', 'organizer'].includes(account?.role)) return undefined

    const controller = new AbortController()
    requestApi('/api/users', { signal: controller.signal }, token)
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('People list response is not valid.')
        setPeople(data)
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        if (requestError.status === 401) onLogout()
        else {
          if (requestError.status === 403) {
            onRefreshAccount().catch((refreshError) => setError(refreshError.message))
          }
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [account?.role, onLogout, onRefreshAccount, token])

  const deletePerson = async (person) => {
    const name = `${person.name} ${person.middleName || ''} ${person.surname}`.replace(/\s+/g, ' ').trim()
    if (!window.confirm(`${name} यांची नोंदणी कायमची हटवायची आहे का? ही कृती पूर्ववत करता येणार नाही.`)) return

    setError('')
    setDeletingId(person._id)
    try {
      await requestApi(`/api/users/${encodeURIComponent(person._id)}`, { method: 'DELETE' }, token)
      setPeople((current) => current.filter((entry) => entry._id !== person._id))
    } catch (requestError) {
      if (requestError.status === 401) onLogout()
      else {
        if (requestError.status === 403) {
          onRefreshAccount().catch((refreshError) => setError(refreshError.message))
        }
        setError(requestError.message)
      }
    } finally {
      setDeletingId('')
    }
  }

  return (
    <main className="retreat-page people-page">
      <header className="retreat-page-heading">
        <p>त्रिरत्न बौद्ध महासंघ · अकोला</p>
        <h1>शिबिर सहभागी</h1>
        <span>नोंदणीकृत सहभागी आणि त्यांची शिबिर माहिती.</span>
      </header>

      {authLoading ? (
        <section className="retreat-card people-empty" role="status">खाते तपासत आहोत…</section>
      ) : !['admin', 'organizer'].includes(account?.role) ? (
        account ? (
          <ApprovalNotice account={account} onLogout={onLogout} onRefreshAccount={onRefreshAccount} />
        ) : (
          <section className="retreat-card people-private-notice" role="status">
            <span aria-hidden="true">🔒</span>
              <h2>Organizer किंवा Admin लॉगिन आवश्यक</h2>
              <p>सहभागींची माहिती फक्त Organizer किंवा Admin खात्याने पाहता येते.</p>
              <a className="retreat-primary-button" href="#organization">Admin / Organizer लॉगिन</a>
          </section>
        )
      ) : (
        <section className="retreat-card people-card" aria-labelledby="people-title">
          <div className="retreat-card-heading">
            <div>
              <span className="retreat-card-kicker">ORGANIZER / ADMIN</span>
              <h2 id="people-title">सहभागी यादी <span>· {people.length}</span></h2>
            </div>
          </div>
          <p className="people-privacy-note">सहभागींची वैयक्तिक माहिती फक्त अधिकृत Organizer आणि Admin वापरासाठी आहे.</p>
          {error && <p className="retreat-feedback is-error" role="alert">{error}</p>}
          {loading ? (
            <p className="people-empty">सहभागी यादी लोड होत आहे…</p>
          ) : people.length ? (
            <div className="people-table-scroll">
              <table className="people-table">
                <thead>
                  <tr><th>नाव</th><th>भूमिका</th><th>शिबिर</th><th>मोबाईल</th><th>ईमेल</th><th>केंद्र</th><th>पेमेंट</th><th>पत्ता</th>{account.role === 'admin' && <th>कृती</th>}</tr>
                </thead>
                <tbody>
                  {people.map((person) => (
                    <tr key={person._id}>
                      <td>{`${person.name} ${person.middleName || ''} ${person.surname}`.replace(/\s+/g, ' ').trim()}</td>
                      <td>{ROLE_LABELS[person.role] || person.role || 'Visitor'}</td>
                      <td>{person.retreatId ? `${person.retreatId.name} · ${person.retreatId.year}` : '—'}</td>
                      <td>{person.mobileNumber}</td>
                      <td>{person.email || '—'}</td>
                      <td>{person.center || '—'}</td>
                      <td>{person.centerPayment || '—'}</td>
                      <td>{person.address}</td>
                      {account.role === 'admin' && <td><button type="button" className="people-delete-button" disabled={deletingId === person._id} onClick={() => deletePerson(person)}>{deletingId === person._id ? 'हटवत आहे…' : 'हटवा'}</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="people-empty">{error ? 'सहभागी यादी मिळाली नाही.' : 'अजून कोणतीही नोंदणी उपलब्ध नाही.'}</p>
          )}
        </section>
      )}
    </main>
  )
}

function RetreatPortal({ page, account, token, authLoading, onAuthenticated, onLogout, onRefreshAccount }) {
  if (page === 'people') {
    return <PeoplePage account={account} token={token} authLoading={authLoading} onLogout={onLogout} onRefreshAccount={onRefreshAccount} />
  }
  if (page === 'organization') {
    return <OrganizationPage account={account} token={token} authLoading={authLoading} onAuthenticated={onAuthenticated} onLogout={onLogout} onRefreshAccount={onRefreshAccount} />
  }
  if (page === 'registration') {
    if (authLoading) {
      return <main className="retreat-page"><section className="retreat-card people-empty" role="status">खाते तपासत आहोत…</section></main>
    }
    if (!account) {
      return (
        <main className="retreat-page">
          <section className="retreat-card people-private-notice" role="status">
            <span aria-hidden="true">🔒</span>
            <h2>लॉगिन आवश्यक</h2>
            <p>शिबिर नोंदणीसाठी Organizer किंवा Admin खात्याने लॉगिन करा.</p>
            <a className="retreat-primary-button" href="#organization">Organizer / Admin लॉगिन</a>
          </section>
        </main>
      )
    }
    if (!['admin', 'organizer'].includes(account.role)) {
      return (
        <main className="retreat-page">
          <ApprovalNotice account={account} onLogout={onLogout} onRefreshAccount={onRefreshAccount} />
        </main>
      )
    }
    return <RegistrationPage token={token} onLogout={onLogout} onRefreshAccount={onRefreshAccount} />
  }
  return <RegistrationPage token={token} onLogout={onLogout} onRefreshAccount={onRefreshAccount} />
}

export default RetreatPortal
