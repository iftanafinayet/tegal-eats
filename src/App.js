import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [places, setPlaces] = useState([])
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Fetch places
    fetchPlaces()
    // Auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_, s) => setSession(s))

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const fetchPlaces = async () => {
    const { data } = await supabase.from('app_places').select('*')
    setPlaces(data || [])
  }

  const signIn = async (email) => {
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  }

  if (!session) {
    return (
      <div>
        <h1>TegalEats</h1>
        <input placeholder="Email" id="email" />
        <button onClick={() => signIn(document.getElementById('email').value)}>
          Kirim Magic Link
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1>Places Tegal ({places.length})</h1>
      <ul>
        {places.map(p => <li key={p.id}>{p.name} ⭐{p.avg_rating}</li>)}
      </ul>
      <button onClick={() => supabase.auth.signOut()}>Logout</button>
    </div>
  )
}

export default App;
