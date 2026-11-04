import test from 'node:test'
import assert from 'node:assert/strict'
import { getEmailFeedback } from './emailNotification.js'

test('email feedback distinguishes SMTP acceptance from delivery', () => {
  for (const context of ['registration', 'signup', 'login']) {
    const feedback = getEmailFeedback({ status: 'sent' }, context)
    assert.equal(feedback.warning, false)
    assert.ok(feedback.message.includes('वितरणाची हमी नाही'))
  }
  assert.ok(getEmailFeedback({ status: 'sent' }, 'signup').message.includes('मंजुरी-प्रलंबित'))
  assert.ok(getEmailFeedback({ status: 'sent' }, 'registration').message.includes('नोंदणीबद्दल धन्यवाद'))
  assert.ok(getEmailFeedback({ status: 'sent' }, 'login').message.includes('टीम स्वागत'))
})

test('mail failure or disabled mail does not invalidate saved data', () => {
  for (const status of ['failed', 'disabled', 'unexpected']) {
    const registration = getEmailFeedback({ status }, 'registration')
    assert.equal(registration.warning, true)
    assert.ok(registration.message.includes('नोंदणी जतन झाली'))
    assert.ok(registration.message.includes('पुन्हा नोंदणी करू नका'))
    const signup = getEmailFeedback({ status }, 'signup')
    assert.ok(signup.message.includes('खाते तयार झाले'))
    assert.ok(signup.message.includes('पुन्हा खाते तयार करू नका'))
    assert.ok(getEmailFeedback({ status }, 'login').message.includes('लॉगिन यशस्वी'))
  }
  assert.ok(getEmailFeedback({ status: 'failed', message: 'Safe API warning' }, 'registration')
    .message.includes('Safe API warning'))
})

test('optional email and absent first-login notifications are handled honestly', () => {
  const feedback = getEmailFeedback({ status: 'skipped' }, 'registration')
  assert.equal(feedback.warning, false)
  assert.ok(feedback.message.includes('ईमेल पत्ता दिलेला नसल्यामुळे'))
  assert.equal(getEmailFeedback(undefined, 'login'), null)
  assert.equal(getEmailFeedback(null, 'registration'), null)
})

test('manual email feedback never claims a new record or login was saved', () => {
  for (const context of ['account-email', 'registration-email']) {
    const sent = getEmailFeedback({ status: 'sent' }, context)
    assert.equal(sent.warning, false)
    assert.ok(sent.message.includes('वितरणाची हमी नाही'))
    assert.ok(!sent.message.includes('लॉगिन यशस्वी'))
    for (const status of ['disabled', 'failed', 'already_attempted', 'unknown']) {
      assert.equal(getEmailFeedback({ status }, context).warning, true)
    }
    assert.equal(getEmailFeedback({ status: 'failed', message: 'Safe SMTP error' }, context).message, 'Safe SMTP error')
  }
})

test('one-time mail outcomes preserve successful login and role changes', () => {
  const login = getEmailFeedback({ status: 'already_attempted' }, 'login')
  assert.equal(login.warning, false)
  assert.ok(login.message.includes('लॉगिन यशस्वी'))
  assert.ok(login.message.includes('पुन्हा पाठवला नाही'))
  for (const status of ['sent', 'disabled', 'failed', 'already_attempted']) {
    const feedback = getEmailFeedback({ status }, 'approval')
    assert.ok(feedback.message.includes('भूमिका जतन झाली'))
    assert.ok(!feedback.message.includes('लॉगिन यशस्वी'))
  }
})
