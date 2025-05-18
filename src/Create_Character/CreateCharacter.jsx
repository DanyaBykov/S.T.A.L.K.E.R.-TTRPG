import React, { useState, useMemo } from 'react';
import './CreateCharacter.css';

// --- Data Definitions ---
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

export default function CreateCharacter() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [charClass, setCharClass] = useState('');
  const initialStats = STAT_NAMES.reduce((a, s) => ({ ...a, [s.key]: 5 }), {});
  const [stats, setStats] = useState(initialStats);
  const [pointsLeft, setPointsLeft] = useState(5);

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

  function handleSubmit(e) {
    e.preventDefault();
    const character = { name, class: charClass, stats, mods, profs: skillTotals,
      passivePerception, personality, story, motivation };
    console.log(character);
    alert('Персонаж створено.');
  }

  return (
    <form className="cc-container" onSubmit={handleSubmit}>
      <h1>Створення персонажа</h1>

      {step===1 && <section>
        <h2>Крок 1: Ім'я та Клас</h2>
        <label>Ім'я:<input value={name} onChange={e=>setName(e.target.value)} /></label>
        <label>Клас:<select value={charClass} onChange={e=>setCharClass(e.target.value)}>
          <option value="">—</option>
          {Object.entries(CLASSES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
        </select></label>
      </section>}

      {step===2 && <section>
        <h2>Крок 2: Характеристики (очок: {pointsLeft})</h2>
        <table><thead><tr><th>Стат</th><th>Значення</th><th>Мод</th><th></th><th></th></tr></thead>
          <tbody>{STAT_NAMES.map(s=>
            <tr key={s.key}>
              <td>{s.label}</td>
              <td>{stats[s.key]}</td>
              <td>{mods[s.key]}</td>
              <td><button type="button" onClick={()=>changeStat(s.key,1)}>+</button></td>
              <td><button type="button" onClick={()=>changeStat(s.key,-1)}>-</button></td>
            </tr>
          )}</tbody>
        </table>
      </section>}

      {step===3 && <section>
        <h2>Крок 3: Навички</h2>
        <div>Виберіть 2 (+2): {countProf}/2</div>
        <table><thead><tr><th>Навичка</th><th>Мод</th><th>Проф</th><th>Загал</th></tr></thead>
          <tbody>{SKILLS.map(sk=>
            <tr key={sk.key}>
              <td>{sk.label}</td>
              <td>{mods[sk.stat]}</td>
              <td><input type="checkbox" checked={profs[sk.key]}
                    onChange={e=>{
                      if(e.target.checked&&countProf>=2) return;
                      setProfs({...profs,[sk.key]:e.target.checked});
                    }} /></td>
              <td>{skillTotals[sk.key]}</td>
            </tr>
          )}</tbody>
        </table>
        <div>Пасивна спостережливість: {passivePerception}</div>
      </section>}

      {step===4 && <section>
        <h2>Крок 4: Особистість, Історія, Мотивація</h2>
        <label>Що цінуєте:<textarea value={personality.valueMost}
            onChange={e=>setPersonality({...personality,valueMost:e.target.value})} /></label>
        <label>Ставлення до людей:<textarea value={personality.attitude}
            onChange={e=>setPersonality({...personality,attitude:e.target.value})} /></label>
        <label>Найцінніша людина:<textarea value={personality.important}
            onChange={e=>setPersonality({...personality,important:e.target.value})} /></label>
        <label>Вади:<textarea value={personality.flaws}
            onChange={e=>setPersonality({...personality,flaws:e.target.value})} /></label>
        <label>Ідеали:<textarea value={personality.ideals}
            onChange={e=>setPersonality({...personality,ideals:e.target.value})} /></label>
        <label>Історія:<textarea value={story} onChange={e=>setStory(e.target.value)} /></label>
        <label>Мотивація:<textarea value={motivation} onChange={e=>setMotivation(e.target.value)} /></label>
      </section>}

      <div className="nav-buttons">
        {step>1 && <button type="button" onClick={prev}>Назад</button>}
        {step<4 && <button type="button" onClick={next} disabled={!allComplete()}>Далі</button>}
        {step===4 && <button type="submit" disabled={!allComplete()}>Створити</button>}
      </div>
    </form>
  );
}
