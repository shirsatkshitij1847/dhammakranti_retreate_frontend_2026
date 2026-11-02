import { useCallback, useEffect, useRef, useState } from 'react'
import buddhaOne from '../buddha1.jpg'
import './App.css'
import HomePage from './HomePage'
import BlogPage from './BlogPage'
import RetreatPortal from './RetreatPortal'
import { requestApi, SESSION_TOKEN_KEY } from './retreatApi'
import TaskBoard from './TaskBoard'

const chapters = [
  { label: 'आमच्याविषयी', href: '#about' },
  { label: 'त्रिरत्न चळवळ', href: '#movement' },
  { label: 'बाबासाहेबांची प्रेरणा', href: '#inspiration' },
  { label: 'आमचे उपक्रम', href: '#activities' },
]

function pageFromHash() {
  const page = window.location.hash.slice(1)
  if (['retreat-setup', 'account-access', 'waiting-approval'].includes(page)) return 'organization'
  if (['blogs', 'tasks', 'registration', 'people', 'organization'].includes(page)) return page
  if (['about', 'movement', 'inspiration', 'activities', 'belief', 'join'].includes(page)) return 'about'
  return 'home'
}

function App() {
  const marqueeTrackRef = useRef(null)
  const pendingProtectedPageRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(pageFromHash)
  const [session, setSession] = useState(() => {
    const token = window.sessionStorage.getItem(SESSION_TOKEN_KEY)
    return { token, account: null, loading: Boolean(token) }
  })
  const isTaskBoard = currentPage === 'tasks'
  const isAboutPage = currentPage === 'about'
  const isHomePage = currentPage === 'home'
  const footerHref = isHomePage
    ? '#about'
    : isAboutPage
    ? '#registration'
    : currentPage === 'people'
      ? '#organization'
      : ['admin', 'organizer'].includes(session.account?.role)
        ? '#people'
        : '#organization'
  const footerLabel = isHomePage
    ? 'आमच्याविषयी'
    : isAboutPage
    ? 'शिबिर नोंदणी'
    : currentPage === 'people'
      ? 'व्यवस्थापन'
      : ['admin', 'organizer'].includes(session.account?.role)
        ? 'सहभागी यादी'
        : 'Admin Login'

  useEffect(() => {
    if (!session.token) return undefined

    const controller = new AbortController()
    requestApi('/api/profile', { signal: controller.signal }, session.token)
      .then((account) => {
        setSession((current) => current.token === session.token
          ? { ...current, account, loading: false }
          : current)
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        window.sessionStorage.removeItem(SESSION_TOKEN_KEY)
        setSession((current) => current.token === session.token
          ? { token: null, account: null, loading: false }
          : current)
      })
    return () => controller.abort()
  }, [session.token])

  const acceptLogin = useCallback((authResult) => {
    window.sessionStorage.setItem(SESSION_TOKEN_KEY, authResult.token)
    setSession({ token: authResult.token, account: authResult.account, loading: false })
    if (pendingProtectedPageRef.current) {
      window.location.hash = `#${pendingProtectedPageRef.current}`
      pendingProtectedPageRef.current = null
    }
  }, [])

  const logout = useCallback(() => {
    window.sessionStorage.removeItem(SESSION_TOKEN_KEY)
    setSession({ token: null, account: null, loading: false })
  }, [])

  const refreshAccount = useCallback(async () => {
    const token = session.token
    if (!token) return null

    try {
      const account = await requestApi('/api/profile', {}, token)
      setSession((current) => current.token === token ? { ...current, account } : current)
      return account
    } catch (error) {
      if (error.status === 401) logout()
      throw error
    }
  }, [logout, session.token])

  useEffect(() => {
    const syncPage = () => setCurrentPage(pageFromHash())
    window.addEventListener('hashchange', syncPage)
    return () => window.removeEventListener('hashchange', syncPage)
  }, [])

  useEffect(() => {
    if (
      ['blogs', 'registration', 'people', 'tasks'].includes(currentPage)
      && !session.loading
      && !session.account
    ) {
      pendingProtectedPageRef.current = currentPage
      window.location.hash = '#organization'
    }
  }, [currentPage, session.account, session.loading])

  useEffect(() => {
    if (!isAboutPage) return undefined

    const track = marqueeTrackRef.current
    const articleCopy = track?.firstElementChild
    if (!track || !articleCopy) {
      return undefined
    }

    const duplicate = articleCopy.cloneNode(true)
    duplicate.setAttribute('aria-hidden', 'true')
    duplicate.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'))
    track.append(duplicate)

    const updateSpeed = () => {
      track.style.setProperty('--marquee-duration', `${articleCopy.offsetHeight / 16}s`)
    }

    const resizeObserver = new ResizeObserver(updateSpeed)
    resizeObserver.observe(articleCopy)
    updateSpeed()

    return () => {
      resizeObserver.disconnect()
      duplicate.remove()
    }
  }, [isAboutPage])

  return (
    <>
      <header className="site-header">
        <a className="header-wordmark" href="#top" aria-label="Triratna Akola — मुख्यपृष्ठ">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Triratna Akola — by the youth, for the youth" />
          <span className="wordmark-copy">
            <strong>त्रिरत्न बौद्ध महासंघ, अकोला</strong>
            <small>TRIRATNA BUDDHIST COMMUNITY</small>
          </span>
        </a>
        <nav className="site-nav" aria-label="पृष्ठ नेव्हिगेशन">
          {session.account && <a href="#blogs">ब्लॉग</a>}
          {!isAboutPage && <a href="#about">आमच्याविषयी</a>}
          {isAboutPage && (
            <>
              {chapters.map((chapter) => (
                <a href={chapter.href} key={chapter.href}>{chapter.label}</a>
              ))}
            </>
          )}
          {['admin', 'organizer'].includes(session.account?.role) && (
            <>
              <a href="#registration">नोंदणी</a>
              <a href="#people">सहभागी</a>
            </>
          )}
          <a href="#organization">{session.account ? 'व्यवस्थापन' : 'Admin Login'}</a>
          <a className="tasks-nav-link" href="#tasks">कार्य वेळापत्रक</a>
          {!isHomePage && <a href="#top">मुख्यपृष्ठ</a>}
        </nav>
      </header>

      {currentPage === 'blogs' ? (
        session.account
          ? <BlogPage key={session.account._id} account={session.account} token={session.token} authLoading={session.loading} />
          : <main className="blog-page"><p role="status">{session.loading ? 'Checking your account…' : 'Login required.'}</p><a href="#organization">Login</a></main>
      ) : isTaskBoard ? (
        session.loading ? (
          <main className="tasks-page"><section className="task-auth-notice" role="status">खाते तपासत आहोत…</section></main>
        ) : session.account ? (
          <TaskBoard />
        ) : (
          <main className="tasks-page">
            <section className="task-auth-notice" role="status">
              <h1>लॉगिन आवश्यक</h1>
              <p>कार्य वेळापत्रक तयार करण्यासाठी लॉगिन करा.</p>
              <a href="#organization">लॉगिन / खाते तयार करा</a>
            </section>
          </main>
        )
      )
        : currentPage === 'registration' || currentPage === 'people'
          ? <RetreatPortal
            page={currentPage}
            account={session.account}
            token={session.token}
            authLoading={session.loading}
            onAuthenticated={acceptLogin}
            onLogout={logout}
            onRefreshAccount={refreshAccount}
          />
          : currentPage === 'organization'
            ? <RetreatPortal
              page={currentPage}
              account={session.account}
              token={session.token}
              authLoading={session.loading}
              onAuthenticated={acceptLogin}
              onLogout={logout}
              onRefreshAccount={refreshAccount}
            />
          : isAboutPage ? <main
        className="about-page"
        id="about-page"
        style={{ '--buddha-background': `url("${buddhaOne}")` }}
      >
        <video
          className="background-video"
          autoPlay
          loop
          muted
          playsInline
          poster={buddhaOne}
          aria-hidden="true"
        >
          <source src={`${import.meta.env.BASE_URL}logo_vedio.mp4`} type="video/mp4" />
        </video>
        <article className="article-layer">
          <p className="panel-brand">त्रिरत्न बौद्ध महासंघ <span>·</span> अकोला</p>
          <div className="article-marquee" aria-label="त्रिरत्न बौद्ध महासंघाविषयी लेख">
            <div className="marquee-track" ref={marqueeTrackRef}>
              <div className="article-copy">
            <header className="article-header" id="about">
              <p className="article-kicker">आमच्याविषयी</p>
              <h1>
                आमच्याविषयी —
                <br />
                <span>बुद्धत्वाचा सुंदर प्रवास</span>
              </h1>
              <p className="article-deck">
                एका छोट्याशा आशेपासून… मैत्री, धम्म आणि परिवर्तनाच्या वाटेवर एकत्र.
              </p>
              <div className="article-byline" aria-label="मैत्री, प्रज्ञा, करुणा आणि परिवर्तन">
                <span><i aria-hidden="true">❋</i> मैत्री</span>
                <span><i aria-hidden="true">✦</i> प्रज्ञा</span>
                <span><i aria-hidden="true">☸</i> करुणा</span>
                <span><i aria-hidden="true">❧</i> परिवर्तन</span>
              </div>
            </header>
            <p>
              कधी विचार केलाय का… प्रत्येक माणसाच्या अंतरंगात एक सुंदर, निर्मळ आणि
              करुणामय व्यक्तिमत्त्व दडलेलं असतं. पण आयुष्याच्या धावपळीत,
              परिस्थितीच्या ओझ्याखाली आणि विचारांच्या गुंत्यात आपण स्वतःमधील त्या
              सुंदर स्वभावाला विसरून जातो.
            </p>
            <p>
              आमचा विश्वास आहे की, <strong>प्रत्येक व्यक्तीमध्ये बुद्ध होण्याची
              क्षमता आहे. प्रत्येकाच्या अंतरंगात बुद्धबीज अर्थात तथागतगर्भ दडलेला
              आहे.</strong>
            </p>
            <p>
              ज्याप्रमाणे जमिनीखाली दडलेले छोटेसे बीज योग्य वातावरण, प्रकाश आणि
              पाणी मिळाल्यावर विशाल वृक्ष बनते, त्याचप्रमाणे ध्यान, मैत्री, प्रज्ञा
              आणि धम्माच्या आचरणातून आपल्यातील बुद्धत्व विकसित होऊ शकते.
            </p>
            <p>
              याच विश्वासातून सुरू झाला आहे <strong>त्रिरत्न बौद्ध महासंघ,
              अकोला</strong> यांचा मैत्रीपूर्ण परिवर्तनाचा प्रवास.
            </p>

            <h2 id="movement">🌏 त्रिरत्न चळवळ म्हणजे नेमकं काय?</h2>
            <p>त्रिरत्न म्हणजे तीन रत्ने — <strong>बुद्ध, धम्म आणि संघ.</strong></p>
            <p>
              त्रिरत्न बौद्ध समुदाय ही जगभर कार्यरत असलेली आधुनिक बौद्ध चळवळ आहे.
              पूज्य उर्गेन संघरक्षित (Urgyen Sangharakshita) यांनी १९६७ मध्ये
              इंग्लंडमध्ये या चळवळीची सुरुवात केली. सुरुवातीला ती Friends of the
              Western Buddhist Order (FWBO) या नावाने ओळखली जात होती. २०१० मध्ये
              तिचे नाव Triratna Buddhist Community असे करण्यात आले.
            </p>
            <p>
              या चळवळीचा मुख्य उद्देश म्हणजे बुद्धांचा प्राचीन धम्म आधुनिक
              जीवनाशी जोडणे आणि तो प्रत्येकासाठी अनुभवण्याजोगा बनवणे.
            </p>
            <p>
              ध्यानसाधना, धम्मअभ्यास, आध्यात्मिक मैत्री, सामूहिक जीवन आणि सामाजिक
              कार्य यांच्या माध्यमातून व्यक्तीच्या वैयक्तिक तसेच सामाजिक
              परिवर्तनासाठी ही चळवळ कार्य करते.
            </p>
            <p>
              भारतात ही चळवळ त्रैलोक्य बौद्ध महासंघ सहाय्यक गण (TBMSG) या नावानेही
              ओळखली जात होती. भारतात तिच्या कार्याच्या विस्तारात धम्मचारी लोकमित्र
              आणि अनेक धम्ममित्रांचे योगदान महत्त्वाचे राहिले आहे.
            </p>
            <p>
              आज त्रिरत्नचा प्रवास विविध देशांतील धम्मकेंद्रे, ध्यानकेंद्रे आणि
              स्थानिक समुदायांमधून सुरू आहे.
            </p>

            <h2 id="inspiration">💙 बाबासाहेबांच्या धम्मक्रांतीची प्रेरणा</h2>
            <p>
              १४ ऑक्टोबर १९५६ रोजी डॉ. बाबासाहेब आंबेडकरांनी लाखो अनुयायांसह
              बुद्धांच्या धम्माची दीक्षा घेतली आणि भारतीय समाजाला स्वातंत्र्य,
              समता, बंधुता व न्यायाचा नवा मार्ग दाखवला.
            </p>
            <p>
              बाबासाहेबांचे स्वप्न केवळ सामाजिक विषमता दूर करण्याचे नव्हते, तर
              प्रत्येक व्यक्तीला स्वाभिमानाने, विवेकाने आणि सन्मानाने जगता यावे,
              असे समाजजीवन घडवण्याचे होते.
            </p>
            <p>त्यांच्या विचारांतून आपल्याला प्रज्ञा, शील आणि करुणेचे महत्त्व समजते.</p>
            <p>
              त्रिरत्न बौद्ध महासंघाच्या भारतीय कार्याला बाबासाहेबांच्या
              धम्मक्रांतीची प्रेरणा लाभली आहे. सामाजिक परिवर्तनासोबतच व्यक्तीचे
              अंतर्मन समृद्ध करण्याचा प्रयत्न या कार्यातून केला जातो.
            </p>
            <blockquote>
              बाबासाहेबांनी दाखवलेला प्रबुद्ध समाजाचा मार्ग आणि बुद्धांनी दिलेला
              अंतर्मन परिवर्तनाचा धम्म — या दोन्ही प्रेरणांना आपल्या जीवनात जोडणे,
              हाच आमच्या प्रवासाचा आधार आहे.
            </blockquote>

            <h2 id="activities">🌼 त्रिरत्न अकोला काय करते?</h2>
            <p>
              आम्ही केवळ कार्यक्रम आयोजित करण्यापुरते मर्यादित राहू इच्छित नाही.
              तर माणसांना जोडणारा, एकमेकांना समजून घेणारा आणि एकत्र शिकण्याची
              संधी देणारा समुदाय निर्माण करण्याचा प्रयत्न करतो.
            </p>
            <p>आमच्या प्रमुख उपक्रमांमध्ये समावेश आहे:</p>
            <ul className="activity-list">
              <li><strong>ध्यानसाधना:</strong> स्वतःच्या मनाला समजून घेण्यासाठी आणि मानसिक शांततेचा अनुभव घेण्यासाठी.</li>
              <li><strong>धम्म प्रशिक्षण:</strong> बुद्धांच्या शिकवणीचा अभ्यास करून ती दैनंदिन जीवनात उतरवण्यासाठी.</li>
              <li><strong>मैत्री भावना:</strong> एकमेकांशी प्रेम, आपलेपणा आणि सकारात्मक संबंध निर्माण करण्यासाठी.</li>
              <li><strong>युवक विकास:</strong> युवकांना आत्मविश्वास, विवेक आणि सकारात्मक जीवनदृष्टी मिळण्यासाठी.</li>
              <li><strong>धम्मशिबिरे व रिट्रीट:</strong> काही काळ दैनंदिन धावपळीतून थांबून स्वतःला जाणून घेण्यासाठी.</li>
              <li><strong>सामाजिक उपक्रम:</strong> समता, करुणा आणि सामाजिक एकात्मतेची भावना वाढवण्यासाठी.</li>
            </ul>

            <h2 id="belief">🌳 आमचा विश्वास – प्रत्येकामध्ये बुद्धत्वाचे बीज आहे!</h2>
            <p>
              आम्हाला वाटते की, माणसाला बदलण्यासाठी नेहमीच मोठ्या गोष्टींची गरज
              नसते.
            </p>
            <p>
              कधी एखादी मैत्रीपूर्ण भेट, कधी मनापासून ऐकून घेणारी व्यक्ती, कधी
              ध्यानातील काही शांत क्षण, तर कधी धम्मातील एखादा विचारसुद्धा
              आयुष्याकडे पाहण्याचा दृष्टिकोन बदलू शकतो.
            </p>
            <p>
              आम्ही परिपूर्ण माणसे घडवण्याचा दावा करत नाही. आम्ही स्वतःही शिकत
              आहोत, अनुभव घेत आहोत आणि एकमेकांच्या साथीने पुढे जात आहोत.
            </p>
            <p>
              आमचा प्रयत्न एवढाच आहे की प्रत्येकाला स्वतःमधील बुद्धबीज
              ओळखण्यासाठी एक सुंदर वातावरण मिळावे.
            </p>

            <h2 id="join">🌸 चला, या प्रवासात सहभागी होऊया!</h2>
            <p>
              कदाचित आपण सर्वजण एका छोट्याशा रोपट्यासारखे आहोत. पण मैत्रीचे पाणी,
              धम्माचा प्रकाश आणि प्रज्ञेची माती मिळाली, तर आपल्या प्रत्येकाच्या
              जीवनात आनंदाचे नंदनवन फुलू शकते.
            </p>
            <p>काही क्षण स्वतःसाठी देऊया…</p>
            <p>स्वतःला समजून घेऊया…</p>
            <p>एकमेकांशी मैत्री निर्माण करूया…</p>
            <p>
              आणि आपल्या अंतरंगातील त्या निर्मळ बुद्धस्वभावाचा शोध घेऊया.
            </p>
            <p>
              <strong>
                कारण बुद्धत्व कुठेतरी बाहेर शोधायचे नाही… त्याच्या दिशेने प्रवास
                स्वतःपासूनच सुरू करायचा आहे!
              </strong>
            </p>

            <div className="article-signoff">
              <h2>🪷 त्रिरत्न बौद्ध महासंघ, अकोला</h2>
              <p><strong>एकत्र शिकूया… एकत्र वाढूया… आणि एकमेकांच्या जीवनात आनंदाची नवी पहाट फुलवूया!</strong></p>
              <p className="closing-values">युवकांनी युवकांसाठी — मैत्रीतून, धम्मातून आणि परिवर्तनातून!</p>
              <p className="closing-salutation">जय भीम! <span>·</span> नमो बुद्धाय!</p>
              <p className="closing-values">॥ सब्बे सत्ता सुखी होन्तु ॥</p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main> : <HomePage />}

      <footer className="site-footer">
        <a className="footer-brand" href="#top">
          त्रिरत्न बौद्ध महासंघ, अकोला
        </a>
        {!isHomePage && <a className="to-top" href={footerHref}>
          {footerLabel}
        </a>}
      </footer>
    </>
  )
}

export default App
