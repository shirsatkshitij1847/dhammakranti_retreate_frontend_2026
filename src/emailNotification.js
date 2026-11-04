export function getEmailFeedback(notification, context) {
  if (!notification) return null

  if (['account-email', 'registration-email'].includes(context)) {
    switch (notification.status) {
      case 'sent':
        return { warning: false, message: 'ईमेल SMTP सर्व्हरने स्वीकारला आहे. Inbox किंवा Spam तपासा; वितरणाची हमी नाही.' }
      case 'already_attempted':
        return { warning: true, message: 'या भूमिकेसाठी स्वागत ईमेलचा प्रयत्न आधीच झाला आहे. पुन्हा पाठवता येणार नाही.' }
      case 'disabled':
        return { warning: true, message: 'सर्व्हरवर ईमेल सेवा बंद आहे. ईमेल पाठवला नाही.' }
      case 'failed':
        return { warning: true, message: notification.message || 'ईमेल पाठवता आला नाही. नोंदणी किंवा खाते पुन्हा तयार करू नका.' }
      default:
        return { warning: true, message: 'ईमेलची स्थिती पडताळता आली नाही. पुन्हा पाठवण्यापूर्वी आयोजकाशी संपर्क साधा.' }
    }
  }

  const saved = context === 'registration'
    ? 'नोंदणी जतन झाली आहे.'
    : context === 'signup'
      ? 'खाते तयार झाले आहे. Admin मंजुरीची विनंती नोंदवली आहे.'
      : context === 'approval'
        ? 'खात्याची भूमिका जतन झाली आहे.'
      : 'लॉगिन यशस्वी झाले आहे.'
  const reminder = context === 'registration'
    ? ' ईमेलसाठी पुन्हा नोंदणी करू नका.'
    : context === 'signup'
      ? ' ईमेलसाठी पुन्हा खाते तयार करू नका.'
      : ''

  switch (notification.status) {
    case 'sent':
      return {
        warning: false,
        message: `${saved} ${context === 'signup' ? 'स्वागत व मंजुरी-प्रलंबित' : context === 'registration' ? 'नोंदणीबद्दल धन्यवाद' : 'टीम स्वागत'} ईमेल पाठवण्यासाठी स्वीकारला गेला आहे. Inbox किंवा Spam तपासा; वितरणाची हमी नाही.`,
      }
    case 'failed':
      return {
        warning: true,
        message: `${saved} ${notification.message || 'ईमेल पाठवता आला नाही. कृपया आयोजकाशी संपर्क साधा.'}${reminder}`,
      }
    case 'disabled':
      return {
        warning: true,
        message: `${saved} सर्व्हरवर ईमेल सेवा बंद आहे, त्यामुळे ईमेल पाठवला नाही. कृपया आयोजकाशी संपर्क साधा.${reminder}`,
      }
    case 'skipped':
      return {
        warning: false,
        message: `${saved} ईमेल पत्ता दिलेला नसल्यामुळे ईमेल पाठवला नाही.`,
      }
    case 'already_attempted':
      return {
        warning: false,
        message: `${saved} या भूमिकेसाठी स्वागत ईमेलचा प्रयत्न आधीच झाला आहे; पुन्हा पाठवला नाही.`,
      }
    default:
      return {
        warning: true,
        message: `${saved} ईमेलची स्थिती पडताळता आली नाही. कृपया आयोजकाशी संपर्क साधा.${reminder}`,
      }
  }
}
