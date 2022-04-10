import { Navbar, Welcome, Footer, Links } from './components';

const App = () => {
  return (
    <div className="min-h-screen">
      <div className="gradient-bg-welcome">
        <Navbar />
        <Welcome />
        <Footer />
        <Links />
      </div>
    </div>
  )
}

export default App;
