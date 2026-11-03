import { useState } from 'react'

function ProfileMenu({ account, loading, onLogout }) {
  const [open, setOpen] = useState(false)
  const name = account?.name || 'Account'
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase() || 'U'

  return (
    <div
      className="profile-menu"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          event.currentTarget.querySelector('button').focus()
        }
      }}
    >
      <button
        className="profile-trigger"
        type="button"
        aria-label={loading ? 'Checking login status' : account ? `Profile: ${name}` : 'Not logged in'}
        aria-expanded={open}
        aria-controls="header-profile-panel"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
      >
        {loading ? '…' : account ? initial : 'U'}
      </button>
      <div className="profile-panel" id="header-profile-panel" hidden={!open}>
        {loading ? <p role="status">Checking your account…</p> : account ? (
          <>
            <strong>{name}</strong>
            <p>{account.email}</p>
            <p>Logged in · {account.role}</p>
            {account.role === 'visitor' && <p>Waiting for admin approval.</p>}
            <a href="#organization" onClick={() => setOpen(false)}>My account</a>
            <button type="button" onClick={() => { setOpen(false); onLogout() }}>Logout</button>
          </>
        ) : (
          <>
            <p>Not logged in</p>
            <a href="#organization" onClick={() => setOpen(false)}>Login / Sign up</a>
          </>
        )}
      </div>
    </div>
  )
}

export default ProfileMenu
