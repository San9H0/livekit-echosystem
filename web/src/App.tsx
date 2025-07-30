import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LiveKitTest1 from './pages/LiveKitTest1';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          borderBottom: '1px solid #dee2e6'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem'
          }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>LiveKit 프로젝트</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link 
                to="/" 
                style={{
                  textDecoration: 'none',
                  color: '#007bff',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                홈
              </Link>
              <Link 
                to="/livekit-test-1" 
                style={{
                  textDecoration: 'none',
                  color: '#007bff',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                LiveKit 테스트 1
              </Link>
            </div>
          </div>
        </nav>

        <main style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/" element={
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1>LiveKit 프로젝트에 오신 것을 환영합니다!</h1>
                <p>이 프로젝트는 LiveKit을 사용한 실시간 비디오/오디오 통신을 테스트하기 위한 것입니다.</p>
                
                <div style={{ 
                  marginTop: '2rem',
                  padding: '1.5rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h2>사용 가능한 테스트:</h2>
                  <ul>
                    <li>
                      <strong>LiveKit 테스트 1:</strong> 기본적인 LiveKit 연결 및 비디오 컨퍼런스 테스트
                    </li>
                  </ul>
                </div>

                <div style={{ 
                  marginTop: '2rem',
                  padding: '1.5rem',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '8px',
                  border: '1px solid #b3d9ff'
                }}>
                  <h3>시작하기:</h3>
                  <p>LiveKit을 테스트하려면 다음이 필요합니다:</p>
                  <ol>
                    <li>LiveKit 서버 (로컬 또는 클라우드)</li>
                    <li>유효한 JWT 토큰</li>
                    <li>카메라와 마이크 권한</li>
                  </ol>
                  <p>
                    <Link 
                      to="/livekit-test-1"
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        marginTop: '1rem'
                      }}
                    >
                      LiveKit 테스트 1 시작하기
                    </Link>
                  </p>
                </div>
              </div>
            } />
            <Route path="/livekit-test-1" element={<LiveKitTest1 />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
