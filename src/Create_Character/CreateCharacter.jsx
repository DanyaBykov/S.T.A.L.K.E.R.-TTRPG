import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { ArrowLeft, ArrowRight, Save, Menu, Check, Plus, Minus } from 'lucide-react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

// --- Data Definitions remain the same ---
const CLASSES = {
  Hunter: { name: "Мисливець", description: "Опис здібностей мисливця..." },
  Soldier: { name: "Солдат", description: "Опис здібностей солдата..." },
  Technician: { name: "Технік", description: "Опис здібностей техніка..." },
  Medic: { name: "Медик", description: "Опис здібностей медика..." },
  Scientist: { name: "Вчений", description: "Опис здібностей вченого..." },
};

const STAT_NAMES = [
  { key: 'str', label: 'Сила' },
  { key: 'dex', label: 'Спритність' },
  { key: 'int', label: 'Інтелект' },
  { key: 'wis', label: 'Мудрість' },
  { key: 'cha', label: 'Харизма' },
  { key: 'sta', label: 'Статура' },
  { key: 'luk', label: 'Удача' },
];

const SKILLS = [
  { key: 'survival', label: 'Виживання', stat: 'wis' },
  { key: 'investigation', label: 'Розслідування', stat: 'int' },
  { key: 'weapons', label: 'Зброя', stat: 'sta' },
  { key: 'melee', label: 'Ближній бій', stat: 'str' },
  { key: 'medicine', label: 'Медицина', stat: 'wis' },
  { key: 'stealth', label: 'Непомітність', stat: 'dex' },
  { key: 'engineering', label: 'Інженерія', stat: 'int' },
  { key: 'mutants', label: 'Мутанти', stat: 'wis' },
  { key: 'perception', label: 'Спостережливість', stat: 'wis' },
  { key: 'athletics', label: 'Атлетика', stat: 'str' },
  { key: 'acrobatics', label: 'Акробатика', stat: 'dex' },
  { key: 'persuasion', label: 'Переговори', stat: 'cha' },
  { key: 'history', label: 'Історія', stat: 'int' },
  { key: 'intimidation', label: 'Залякування', stat: 'cha' },
  { key: 'zone_knowledge', label: 'Знання зони', stat: 'wis' },
];

function calcMod(stat) {
  if (stat >= 10) return 3;
  if (stat >= 8) return 2;
  if (stat >= 6) return 1;
  if (stat === 5) return 0;
  if (stat >= 3) return -1;
  return -2;
}

// --- Styled Components ---
const Container = styled.div`
  background-color: #0a0a0a;
  color: #a3ffa3;
  min-height: 100vh;
  padding: 2rem;
  font-family: 'Courier New', monospace;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  
  h1 {
    font-size: 2rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0;
    text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
    font-weight: normal;
  }
`;

const MenuBtn = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #a3ffa3;
  cursor: pointer;
  z-index: 100;
  
  svg {
    filter: drop-shadow(0 0 2px rgba(163, 255, 163, 0.6));
    animation: pulse 2s infinite;
    background: rgba(20, 20, 20, 0.7);
    padding: 8px;
    border: 1px solid #444;
  }
  
  @keyframes pulse {
    0% { text-shadow: 0 0 5px rgba(163, 255, 163, 0.3); }
    50% { text-shadow: 0 0 10px rgba(163, 255, 163, 0.7); }
    100% { text-shadow: 0 0 5px rgba(163, 255, 163, 0.3); }
  }
  
  &:hover svg {
    filter: drop-shadow(0 0 3px rgba(163, 255, 163, 0.9));
  }
`;

const MenuList = styled.div`
  position: absolute;
  top: 56px;
  right: 0;
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  border: 1px solid #444;
  min-width: 200px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 100;
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      transparent 50%, 
      rgba(0, 0, 0, 0.1) 50%
    );
    background-size: 100% 4px;
    pointer-events: none;
  }
  
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    background-color: #a3ffa3;
    opacity: 0.7;
  }
  
  ul {
    list-style: none;
    margin: 0;
    padding: 5px 0;
    position: relative;
    z-index: 2;
  }
  
  li {
    padding: 0;
    border-bottom: 1px solid rgba(100, 100, 100, 0.2);
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  a {
    display: block;
    padding: 12px 16px;
    color: #a3ffa3;
    text-decoration: none;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(163, 255, 163, 0.1);
      padding-left: 20px;
      text-shadow: 0 0 5px rgba(163, 255, 163, 0.8);
    }
    
    &:before {
      content: "> ";
      opacity: 0.7;
    }
  }
`;

const FormPanel = styled.div`
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  padding: 2rem;
  margin-bottom: 2rem;
  position: relative;
  border-left: 5px solid rgba(163, 255, 163, 0.7);
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      transparent 50%, 
      rgba(0, 0, 0, 0.1) 50%
    );
    background-size: 100% 4px;
    pointer-events: none;
  }
  
  h2 {
    font-size: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 0 0 1.5rem 0;
    text-shadow: 0 0 3px rgba(163, 255, 163, 0.5);
    font-weight: normal;
    position: relative;
    
    &:before {
      content: "//";
      margin-right: 8px;
      opacity: 0.7;
    }
  }
`;

const FormSection = styled.section`
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.9rem;
  
  &:before {
    content: "> ";
    opacity: 0.7;
  }
`;

const Input = styled.input`
  background-color: rgba(20, 20, 20, 0.8);
  border: 1px solid #444;
  color: #a3ffa3;
  padding: 0.75rem;
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  margin-top: 0.25rem;
  
  &:focus {
    outline: none;
    border-color: #a3ffa3;
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
`;

const Select = styled.select`
  background-color: rgba(20, 20, 20, 0.8);
  border: 1px solid #444;
  color: #a3ffa3;
  padding: 0.75rem;
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  margin-top: 0.25rem;
  
  &:focus {
    outline: none;
    border-color: #a3ffa3;
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
  
  option {
    background-color: #1a1a1a;
  }
`;

const TextArea = styled.textarea`
  background-color: rgba(20, 20, 20, 0.8);
  border: 1px solid #444;
  color: #a3ffa3;
  padding: 0.75rem;
  width: 100%;
  min-height: 100px;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  margin-top: 0.25rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #a3ffa3;
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1rem 0;
  
  th {
    text-align: left;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid #444;
    text-transform: uppercase;
    font-size: 0.85rem;
    font-weight: normal;
    letter-spacing: 1px;
  }
  
  td {
    padding: 0.75rem;
    border-bottom: 1px solid rgba(68, 68, 68, 0.3);
  }
  
  tr:hover td {
    background: rgba(163, 255, 163, 0.05);
  }
`;

const Checkbox = styled.input`
  appearance: none;
  width: 20px;
  height: 20px;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid #444;
  cursor: pointer;
  position: relative;
  margin: 0;
  
  &:checked {
    background: rgba(163, 255, 163, 0.2);
    border-color: #a3ffa3;
    
    &:after {
      content: '';
      position: absolute;
      top: 5px;
      left: 5px;
      width: 8px;
      height: 8px;
      background: #a3ffa3;
    }
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
`;

const StatButton = styled.button`
  background: rgba(30, 40, 30, 0.9);
  border: 1px solid #a3ffa3;
  color: #a3ffa3;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  
  &:hover:not(:disabled) {
    background: rgba(50, 60, 50, 0.9);
    text-shadow: 0 0 5px rgba(163, 255, 163, 0.8);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const StatsValue = styled.span`
  padding: 0.3rem 0.7rem;
  background: rgba(20, 20, 20, 0.7);
  border: 1px solid #444;
  min-width: 40px;
  display: inline-block;
  text-align: center;
`;

const ModValue = styled.span`
  font-family: monospace;
  padding: 0.3rem 0.7rem;
  color: ${props => props.$positive ? '#a3ffa3' : props.$negative ? '#ff6666' : '#a3ffa3'};
  text-shadow: ${props => props.$positive ? '0 0 5px rgba(163, 255, 163, 0.5)' : props.$negative ? '0 0 5px rgba(255, 102, 102, 0.5)' : 'none'};
`;

const StepCounter = styled.div`
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: rgba(163, 255, 163, 0.7);
`;

const PointsCounter = styled.div`
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(20, 20, 20, 0.7);
  border: 1px solid #444;
  display: inline-block;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
`;

const Button = styled.button`
  background-color: rgba(30, 40, 30, 0.9);
  border: 1px solid #a3ffa3;
  color: #a3ffa3;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  text-transform: uppercase;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background-color: rgba(50, 60, 50, 0.9);
    text-shadow: 0 0 5px rgba(163, 255, 163, 0.8);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const NextButton = styled(Button)`
  background-color: rgba(30, 40, 50, 0.9);
  border-color: #66ccff;
  color: #66ccff;
  
  &:hover:not(:disabled) {
    background-color: rgba(30, 50, 70, 0.9);
    text-shadow: 0 0 5px rgba(102, 204, 255, 0.8);
  }
`;

const SubmitButton = styled(NextButton)`
  background-color: rgba(30, 50, 30, 0.9);
  border-color: #a3ffb0;
  color: #a3ffb0;
  
  &:hover:not(:disabled) {
    background-color: rgba(30, 70, 30, 0.9);
    text-shadow: 0 0 5px rgba(163, 255, 176, 0.8);
  }
`;

const InfoText = styled.div`
  margin: 1rem 0;
  padding: 0.75rem;
  background: rgba(30, 40, 50, 0.6);
  border-left: 2px solid #66ccff;
  font-size: 0.9rem;
`;

export default function CreateCharacter() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [charClass, setCharClass] = useState('');
  const initialStats = STAT_NAMES.reduce((a, s) => ({ ...a, [s.key]: 5 }), {});
  const [stats, setStats] = useState(initialStats);
  const [pointsLeft, setPointsLeft] = useState(5);
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const mods = useMemo(() => {
    return STAT_NAMES.reduce((a, { key }) => ({ ...a, [key]: calcMod(stats[key]) }), {});
  }, [stats]);

  function changeStat(key, delta) {
    const val = stats[key] + delta;
    if (val < 1 || val > 10) return;
    const cost = delta > 0 ? 1 : -1;
    if (pointsLeft - cost < 0) return;
    setStats({ ...stats, [key]: val });
    setPointsLeft(pointsLeft - cost);
  }

  const [profs, setProfs] = useState(SKILLS.reduce((a, s) => ({ ...a, [s.key]: false }), {}));
  const PROF_BONUS = 2;
  const skillTotals = useMemo(() => {
    const tot = {};
    SKILLS.forEach(({ key, stat }) => tot[key] = mods[stat] + (profs[key] ? PROF_BONUS : 0));
    return tot;
  }, [mods, profs]);
  const passivePerception = 10 + mods['perception'];

  const [personality, setPersonality] = useState({
    valueMost: '', attitude: '', important: '', flaws: '', ideals: ''
  });
  const [story, setStory] = useState('');
  const [motivation, setMotivation] = useState('');

  const countProf = Object.values(profs).filter(v => v).length;

  const next = () => setStep(s => s+1);
  const prev = () => setStep(s => s-1);

  const allComplete = () => {
    if (step === 1) return name && charClass;
    if (step === 2) return pointsLeft === 0;
    if (step === 3) return countProf === 2;
    if (step === 4) return [
      personality.valueMost,
      personality.attitude,
      personality.important,
      personality.flaws,
      personality.ideals,
      story,
      motivation
    ].every(v => v);
    return false;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      const character = { 
        name, 
        charClass, 
        stats, 
        mods, 
        profs: skillTotals,
        passivePerception, 
        personality, 
        story, 
        motivation 
      };
      
      const response = await apiRequest(`/games/${gameId}/character/create`, {
        method: 'POST',
        body: JSON.stringify(character)
      });
      
      alert('Персонаж створено успішно!');
      navigate(`/game/${gameId}/character/${response.id}`);
    } catch (error) {
      console.error('Error creating character:', error);
      alert('Помилка при створенні персонажа. Спробуйте ще раз.');
    }
  }

  return (
    <Container>
      <MenuBtn onClick={() => setMenuOpen(!menuOpen)}>
        <Menu size={32} />
      </MenuBtn>
      
      {menuOpen && (
        <MenuList>
          <ul>
            <li><Link to="/">MAIN TERMINAL</Link></li>
            <li><Link to={`/game/${gameId}/characters`}>CHARACTERS</Link></li>
            <li><Link to="/map">ZONE MAP</Link></li>
            <li><Link to="/journal">JOURNAL</Link></li>
          </ul>
        </MenuList>
      )}
      
      <Header>
        <h1>СТВОРЕННЯ СТАЛКЕРА</h1>
      </Header>
      
      <StepCounter>КРОК {step} з 4</StepCounter>
      
      <form onSubmit={handleSubmit}>
        <FormPanel>
          {step === 1 && (
            <FormSection>
              <h2>Ім'я та Клас</h2>
              <FormGroup>
                <Label htmlFor="name">Ім'я:</Label>
                <Input 
                  id="name" 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  autoFocus
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="charClass">Клас:</Label>
                <Select 
                  id="charClass" 
                  value={charClass} 
                  onChange={e => setCharClass(e.target.value)}
                >
                  <option value="">—</option>
                  {Object.entries(CLASSES).map(([k, v]) => (
                    <option key={k} value={k}>{v.name}</option>
                  ))}
                </Select>
              </FormGroup>
              
              {charClass && (
                <InfoText>
                  {CLASSES[charClass].description}
                </InfoText>
              )}
            </FormSection>
          )}

          {step === 2 && (
            <FormSection>
              <h2>Характеристики</h2>
              <PointsCounter>Вільних очок: {pointsLeft}</PointsCounter>
              
              <StyledTable>
                <thead>
                  <tr>
                    <th>Характеристика</th>
                    <th>Значення</th>
                    <th>Модифікатор</th>
                    <th colSpan="2">Змінити</th>
                  </tr>
                </thead>
                <tbody>
                  {STAT_NAMES.map(s => (
                    <tr key={s.key}>
                      <td>{s.label}</td>
                      <td>
                        <StatsValue>{stats[s.key]}</StatsValue>
                      </td>
                      <td>
                        <ModValue 
                          $positive={mods[s.key] > 0}
                          $negative={mods[s.key] < 0}
                        >
                          {mods[s.key] > 0 ? `+${mods[s.key]}` : mods[s.key]}
                        </ModValue>
                      </td>
                      <td>
                        <StatButton 
                          type="button" 
                          onClick={() => changeStat(s.key, 1)}
                          disabled={pointsLeft <= 0 || stats[s.key] >= 10}
                        >
                          <Plus size={16} />
                        </StatButton>
                      </td>
                      <td>
                        <StatButton 
                          type="button" 
                          onClick={() => changeStat(s.key, -1)}
                          disabled={stats[s.key] <= 1}
                        >
                          <Minus size={16} />
                        </StatButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            </FormSection>
          )}

          {step === 3 && (
            <FormSection>
              <h2>Навички</h2>
              <InfoText>Виберіть 2 навички (+2): {countProf}/2</InfoText>
              
              <StyledTable>
                <thead>
                  <tr>
                    <th>Навичка</th>
                    <th>Базовий мод.</th>
                    <th>Професія</th>
                    <th>Загальний</th>
                  </tr>
                </thead>
                <tbody>
                  {SKILLS.map(sk => (
                    <tr key={sk.key}>
                      <td>{sk.label}</td>
                      <td>
                        <ModValue 
                          $positive={mods[sk.stat] > 0}
                          $negative={mods[sk.stat] < 0}
                        >
                          {mods[sk.stat] > 0 ? `+${mods[sk.stat]}` : mods[sk.stat]}
                        </ModValue>
                      </td>
                      <td>
                        <Checkbox 
                          type="checkbox" 
                          checked={profs[sk.key]}
                          onChange={e => {
                            if (e.target.checked && countProf >= 2) return;
                            setProfs({...profs, [sk.key]: e.target.checked});
                          }}
                        />
                      </td>
                      <td>
                        <ModValue 
                          $positive={skillTotals[sk.key] > 0}
                          $negative={skillTotals[sk.key] < 0}
                        >
                          {skillTotals[sk.key] > 0 ? `+${skillTotals[sk.key]}` : skillTotals[sk.key]}
                        </ModValue>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
              
              <InfoText>
                Пасивна спостережливість: {passivePerception}
              </InfoText>
            </FormSection>
          )}

          {step === 4 && (
            <FormSection>
              <h2>Особистість, Історія, Мотивація</h2>
              
              <FormGroup>
                <Label htmlFor="valueMost">Що цінуєте:</Label>
                <TextArea 
                  id="valueMost"
                  value={personality.valueMost}
                  onChange={e => setPersonality({...personality, valueMost: e.target.value})}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="attitude">Ставлення до людей:</Label>
                <TextArea 
                  id="attitude"
                  value={personality.attitude}
                  onChange={e => setPersonality({...personality, attitude: e.target.value})}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="important">Найцінніша людина:</Label>
                <TextArea 
                  id="important"
                  value={personality.important}
                  onChange={e => setPersonality({...personality, important: e.target.value})}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="flaws">Вади:</Label>
                <TextArea 
                  id="flaws"
                  value={personality.flaws}
                  onChange={e => setPersonality({...personality, flaws: e.target.value})}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="ideals">Ідеали:</Label>
                <TextArea 
                  id="ideals"
                  value={personality.ideals}
                  onChange={e => setPersonality({...personality, ideals: e.target.value})}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="story">Історія:</Label>
                <TextArea 
                  id="story"
                  value={story}
                  onChange={e => setStory(e.target.value)}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="motivation">Мотивація:</Label>
                <TextArea 
                  id="motivation"
                  value={motivation}
                  onChange={e => setMotivation(e.target.value)}
                />
              </FormGroup>
            </FormSection>
          )}
        </FormPanel>
        
        <NavigationButtons>
          {step > 1 && (
            <Button type="button" onClick={prev}>
              <ArrowLeft size={16} />
              Назад
            </Button>
          )}
          
          {step < 4 ? (
            <NextButton 
              type="button" 
              onClick={next} 
              disabled={!allComplete()}
            >
              Далі
              <ArrowRight size={16} />
            </NextButton>
          ) : (
            <SubmitButton 
              type="submit" 
              disabled={!allComplete()}
            >
              <Save size={16} />
              Створити Сталкера
            </SubmitButton>
          )}
        </NavigationButtons>
      </form>
    </Container>
  );
}