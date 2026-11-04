import { useEffect, useRef, useState } from 'react'
import UpcomingRetreats from './UpcomingRetreats'

const galleryPhotos = Object.entries(import.meta.glob('../photos/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}))
  .sort(([first], [second]) => first.localeCompare(second))
  .map(([src], index) => ({ src, number: String(index + 1).padStart(2, '0') }))

function HomePage() {
  const trackRef = useRef(null)
  const windowRef = useRef(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoOffset, setPhotoOffset] = useState(0)

  useEffect(() => {
    if (selectedPhoto === null) return undefined
    const updatePosition = () => {
      const photo = trackRef.current.firstElementChild.children[selectedPhoto]
      setPhotoOffset((windowRef.current.clientHeight - photo.offsetHeight) / 2 - photo.offsetTop)
    }
    const observer = new ResizeObserver(updatePosition)
    observer.observe(windowRef.current)
    observer.observe(trackRef.current.firstElementChild)
    updatePosition()
    return () => observer.disconnect()
  }, [selectedPhoto])

  const movePhoto = (direction) => {
    const track = trackRef.current
    const photo = track.firstElementChild.firstElementChild
    const step = photo.offsetHeight + parseFloat(getComputedStyle(track.firstElementChild).rowGap)
    const translation = new DOMMatrix(getComputedStyle(track).transform).m42
    const current = selectedPhoto ?? Math.round(
      ((windowRef.current.clientHeight - photo.offsetHeight) / 2 - translation) / step,
    )
    setSelectedPhoto((current + direction + galleryPhotos.length * 2) % galleryPhotos.length)
  }

  return (
    <main
      className="home-page"
      id="top"
      style={{ '--home-background': `url("${import.meta.env.BASE_URL}baground_stupa.png")` }}
    >
      <section className="home-gallery-hero" aria-labelledby="home-gallery-title">
        <div className="home-gallery-copy">
          <p className="home-gallery-kicker">त्रिरत्न बौद्ध महासंघ · अकोला</p>
          <h1 id="home-gallery-title">आठवणींचे <span>सुंदर क्षण</span></h1>
          <p className="home-gallery-intro">मैत्री, धम्म आणि एकत्रित प्रवासाच्या काही सुंदर क्षणांतून…</p>
          <div className="home-photo-stream" tabIndex={0} aria-label="त्रिरत्न अकोला कार्यक्रमांची छायाचित्रे">
            <button className="photo-step-button photo-step-top" type="button" onClick={() => movePhoto(-1)} aria-label="Previous photo">↑</button>
            <div className="photo-gallery-window" ref={windowRef}>
              <div
                className={`photo-gallery-track${selectedPhoto === null ? '' : ' photo-gallery-manual'}`}
                ref={trackRef}
                style={selectedPhoto === null ? undefined : { transform: `translateY(${photoOffset}px)` }}
              >
                {[false, true].map((isDuplicate) => (
                  <div className="photo-gallery-group" aria-hidden={isDuplicate || undefined} key={`gallery-${isDuplicate}`}>
                    {galleryPhotos.map((photo) => (
                      <figure className="stream-photo" key={photo.src}>
                        <img
                          src={photo.src}
                          alt={isDuplicate ? '' : `त्रिरत्न अकोला कार्यक्रमाचे छायाचित्र ${photo.number}`}
                          loading="eager"
                        />
                      </figure>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="photo-controls-bottom">
              <button className="photo-step-button" type="button" onClick={() => movePhoto(1)} aria-label="Next photo">↓</button>
              {selectedPhoto !== null && (
                <>
                  <span className="photo-position" role="status">{selectedPhoto + 1} / {galleryPhotos.length}</span>
                  <button className="photo-step-button" type="button" onClick={() => setSelectedPhoto(null)} aria-label="Resume automatic photo scrolling">▶</button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="home-buddha-art" aria-hidden="true">
          <div className="buddha-figure">
            <span className="buddha-halo" />
            <img src={`${import.meta.env.BASE_URL}standingBuddha.png`} alt="" />
          </div>
          <span className="buddha-art-caption">शांती · मैत्री · प्रज्ञा</span>
        </div>
      </section>
      <UpcomingRetreats />
    </main>
  )
}

export default HomePage
