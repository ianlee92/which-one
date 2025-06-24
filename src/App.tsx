import { useState } from 'react'
import './App.css'

const INTERESTS = ['영화', '음악', '운동', '독서', '게임', '여행'] as const;
type Interest = typeof INTERESTS[number];

function App() {
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [interests, setInterests] = useState<Interest[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleInterestChange = (interest: Interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // TODO: 서버로 프로필 정보 전송 및 매칭 대기
  };

  if (submitted) {
    return (
      <div className="profile-waiting">
        <h2>매칭 대기 중...</h2>
        <p>잠시만 기다려주세요. 비슷한 사람을 찾고 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="profile-form-container">
      <h2>프로필 입력</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <label>
          닉네임
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            required
          />
        </label>
        <label>
          나이
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            required
            min={1}
            max={120}
          />
        </label>
        <label>
          지역
          <input
            type="text"
            value={region}
            onChange={e => setRegion(e.target.value)}
            required
          />
        </label>
        <fieldset>
          <legend>관심사 (복수 선택 가능)</legend>
          {INTERESTS.map((interest) => (
            <label key={interest} style={{ marginRight: 12 }}>
              <input
                type="checkbox"
                checked={interests.includes(interest)}
                onChange={() => handleInterestChange(interest)}
              />
              {interest}
            </label>
          ))}
        </fieldset>
        <button type="submit" style={{ marginTop: 16 }}>매칭 시작</button>
      </form>
    </div>
  );
}

export default App
