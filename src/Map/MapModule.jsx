import React, { useState, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import Draggable from 'react-draggable';
import { Plus, UserCircle } from 'lucide-react';
import TileRenderer from './TileRenderer';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../services/api'


const Container = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
`;

const MapContainer = styled.div`
  flex: 1;
  position: relative;
  height: 100%; 
  overflow: hidden; 
`;

const MapImg = styled.img`
  width: 100%;
  height: 100%; 
  object-fit: contain; 
  display: block; 
`;


const Overlay = styled.div`
  position: absolute;
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  color: #a3ffa3;
  border-radius: 0;
  border: 1px solid #444;
  padding: 15px;
  font-family: 'Courier New', monospace;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  
  
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
  
  h3 {
    margin: 0 0 15px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: normal;
    font-size: 16px;
    text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
    position: relative;
    padding-left: 10px;
    
    &:before {
      content: "
      position: absolute;
      left: -5px;
      opacity: 0.7;
    }
  }
`;

const DicePanel = styled(Overlay)`
  top: 16px;
  left: 16px;
  width: 260px;
  z-index: 5;
`;

const DiceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 8px;
  column-gap: 12px;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
  
  span {
    font-size: 14px;
  }
`;

const NumberInput = styled.input`
  width: 40px;
  padding: 4px;
  text-align: center;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 0;
  color: #a3ffa3;
  font-family: 'Courier New', monospace;
  
  &:focus {
    outline: none;
    border-color: #a3ffa3;
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
`;

const Button = styled.button`
  margin-top: 10px;
  width: 100%;
  padding: 10px;
  background: #1a2a1a;
  color: #a3ffa3;
  border: 1px solid #444;
  border-radius: 0;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 14px;
  position: relative;
  transition: all 0.2s ease;
  z-index: 1;
  
  &:before {
    content: ">";
    position: absolute;
    left: 10px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover {
    background: #2a3a2a;
    padding-left: 25px;
    
    &:before {
      opacity: 1;
    }
  }
  
  &:disabled {
    background: #333;
    color: #777;
    cursor: default;
    
    &:before {
      opacity: 0;
    }
  }
`;

const ResultsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  max-height: 75px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #444;
  }
`;

const DiceResult = styled(motion.div)`
  width: 32px;
  height: 32px;
  background: #1a2a1a;
  border: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  font-size: 0.9rem;
  position: relative;
  
  
  @keyframes resultPulse {
    0% { box-shadow: 0 0 3px rgba(163, 255, 163, 0.3) inset; }
    50% { box-shadow: 0 0 5px rgba(163, 255, 163, 0.6) inset; }
    100% { box-shadow: 0 0 3px rgba(163, 255, 163, 0.3) inset; }
  }
  
  animation: resultPulse 2s infinite;
`;


const AvatarPanel = styled.div`
  width: 30%;
  height: 100%;
  background-image: linear-gradient(to bottom, 
    rgba(15, 20, 15, 0.95),
    rgba(25, 30, 25, 0.95)
  );
  color: #a3ffa3;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  font-family: 'Courier New', monospace;
  border-left: 5px solid rgba(163, 255, 163, 0.5);
  position: relative;
  
  
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
    z-index: 0;
  }
`;

const PanelHeader = styled.h3`
  margin: 0 0 18px;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: normal;
  text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  position: relative;
  z-index: 1;
  
  &:before {
    content: "
    opacity: 0.7;
  }
`;

const Avatars = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  background: #1a2a1a;
  border: 1px solid #444;
  border-radius: 0;
  position: relative;
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(45deg, 
      rgba(163, 255, 163, 0) 40%,
      rgba(163, 255, 163, 0.1) 50%,
      rgba(163, 255, 163, 0) 60%
    );
    animation: avatarScan 3s infinite linear;
    
    @keyframes avatarScan {
      0% { background-position: -100px -100px; }
      100% { background-position: 100px 100px; }
    }
  }
`;

const InventoryBlock = styled.div`
  background: #1a1a1a;
  flex: 1;
  border: 1px solid #444;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #a3ffa3;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  z-index: 1;
  
  
  &:before, &:after {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    border-color: #a3ffa3;
    border-style: solid;
    opacity: 0.7;
  }
  
  &:before {
    top: 5px;
    left: 5px;
    border-width: 2px 0 0 2px;
  }
  
  &:after {
    bottom: 5px;
    right: 5px;
    border-width: 0 2px 2px 0;
  }
`;


const MenuBtn = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  color: #a3ffa3; 
  z-index: 100;
  
  
  @keyframes pulse {
    0% { text-shadow: 0 0 5px rgba(163, 255, 163, 0.3); }
    50% { text-shadow: 0 0 10px rgba(163, 255, 163, 0.7); }
    100% { text-shadow: 0 0 5px rgba(163, 255, 163, 0.3); }
  }
  
  svg {
    filter: drop-shadow(0 0 2px rgba(163, 255, 163, 0.6));
    animation: pulse 2s infinite;
    background: rgba(20, 20, 20, 0.7);
    padding: 8px;
    border: 1px solid #444;
    border-radius: 3px;
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
  border-radius: 0; 
  min-width: 200px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  
  
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
    z-index: 1;
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
    font-family: 'Courier New', monospace; 
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
const GridContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
`;

const GridOverlay = styled.div`
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(to right, rgba(163, 255, 163, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(163, 255, 163, 0.1) 1px, transparent 1px);
  background-size: ${props => props.gridSize * props.scale}px ${props => props.gridSize * props.scale}px;
  background-position: ${props => {
    // Use proper modulo that works with negative numbers for correct grid alignment
    const moduloX = ((props.offsetX % (props.gridSize * props.scale)) + (props.gridSize * props.scale)) % (props.gridSize * props.scale);
    const moduloY = ((props.offsetY % (props.gridSize * props.scale)) + (props.gridSize * props.scale)) % (props.gridSize * props.scale);
    return `${moduloX}px ${moduloY}px`;
  }};
`;
const GridControl = styled(Overlay)`
  bottom: 16px;
  left: 16px;
  z-index: 5;
  width: 210px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ControlRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const ScaleLegend = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  background-image: linear-gradient(to bottom, 
    rgba(20, 25, 20, 0.9),
    rgba(30, 35, 30, 0.9)
  );
  color: #a3ffa3;
  border: 1px solid #444;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  z-index: 5;
  display: flex;
  align-items: center;
  
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
`;

const ScaleLine = styled.div`
  height: 4px;
  width: 100px;
  background-color: #a3ffa3;
  margin-right: 8px;
`;
const PinContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none; 
`;
const CharacterPin = styled.div`
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background: ${props => props.color || 'rgba(20, 25, 20, 0.8)'};
  border: 2px solid rgba(163, 255, 163, 0.7);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.6), 
              ${props => props.isSnapped ? '0 0 0 1px #a3ffa3' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto; 
  user-select: none;
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: grab;
  overflow: hidden;
  
  
  &:after {
    content: "";
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      ${props => props.isMonster ? 'rgba(255, 100, 100, 0.4)' : 'rgba(163, 255, 163, 0.4)'} 0%,
      rgba(163, 255, 163, 0) 70%
    );
    z-index: -1;
    opacity: 0.7;
    animation: pulse 2s infinite;
  }
  
  &:active {
    cursor: grabbing;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: ${props => props.isMonster ? 'sepia(0.3) hue-rotate(-20deg)' : 'sepia(0.2) hue-rotate(30deg)'};
  }
  
  span {
    position: absolute;
    bottom: -18px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    text-shadow: 0 0 3px #000, 0 0 3px #000, 0 0 3px #000;
    font-size: 12px;
    color: ${props => props.isMonster ? '#ff9999' : '#a3ffa3'};
    pointer-events: none;
  }
`;
const PinPanel = styled(Overlay)`
  top: 16px;
  left: 292px; 
  width: 280px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  z-index: 5;
  
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #444;
  }
`;

const PinTabs = styled.div`
  display: flex;
  margin-bottom: 15px;
`;

const PinTab = styled.div`
  flex: 1;
  padding: 5px;
  text-align: center;
  background: ${props => props.active ? 'rgba(163, 255, 163, 0.2)' : 'transparent'};
  border-bottom: 2px solid ${props => props.active ? '#a3ffa3' : 'transparent'};
  cursor: pointer;
  font-size: 14px;
  text-transform: uppercase;
  
  &:hover {
    background: rgba(163, 255, 163, 0.1);
  }
`;

const PinItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(163, 255, 163, 0.2);
  
  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`;
const PinAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid ${props => props.isMonster ? '#ff9999' : '#a3ffa3'};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PinNameInput = styled.input`
  background: #1a1a1a;
  border: 1px solid #444;
  color: ${props => props.isMonster ? '#ff9999' : '#a3ffa3'};
  padding: 4px 8px;
  width: 120px;
  font-family: 'Courier New', monospace;
  
  &:focus {
    outline: none;
    border-color: ${props => props.isMonster ? '#ff9999' : '#a3ffa3'};
    box-shadow: 0 0 5px rgba(163, 255, 163, 0.3);
  }
`;

const PinControls = styled.div`
  display: flex;
  margin-left: auto;
  gap: 8px;
`;

const PinButton = styled(Button)`
  width: auto;
  margin-top: 0;
  padding: 4px 8px;
  font-size: 12px;
`;

const AddPinButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  background: ${props => props.isMonster ? 'rgba(80, 20, 20, 0.8)' : '#1a2a1a'};
  
  &:hover {
    background: ${props => props.isMonster ? 'rgba(100, 30, 30, 0.8)' : '#2a3a2a'};
  }
`;
const AvatarSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 15px 0;
  
  div {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    
    &.selected {
      border-color: ${props => props.isMonster ? '#ff9999' : '#a3ffa3'};
      transform: scale(1.1);
    }
    
    &:hover {
      transform: scale(1.1);
      border-color: rgba(163, 255, 163, 0.5);
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
`;
// Add these styled components before the MapPage function

const LoadingIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #a3ffa3;
  position: relative;
  overflow: hidden;
  
  span {
    font-style: italic;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 14px;
    margin-bottom: 20px;
  }
  
  .scanner-line {
    position: absolute;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, 
      rgba(163, 255, 163, 0) 0%,
      rgba(163, 255, 163, 0.8) 50%,
      rgba(163, 255, 163, 0) 100%
    );
    animation: scan 2s infinite;
  }
  
  @keyframes scan {
    0% { top: 0; }
    100% { top: 100%; }
  }
`;

const NoCharacterData = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #a3ffa3;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-style: italic;
`;

const CharacterHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(163, 255, 163, 0.3);
  padding-bottom: 15px;
`;

const CharacterAvatar = styled.div`
  width: 70px;
  height: 70px;
  border: 1px solid #444;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5) inset;
  background: rgba(30, 30, 30, 0.6);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: sepia(0.2) hue-rotate(30deg);
  }
`;

const StatusIndicator = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#a3ffa3' : '#ff6666'};
  bottom: 5px;
  right: 5px;
  border: 1px solid #1a1a1a;
  box-shadow: 0 0 5px ${props => props.active ? 'rgba(163, 255, 163, 0.8)' : 'rgba(255, 102, 102, 0.8)'};
  animation: pulse 2s infinite;
`;

const CharacterNameplate = styled.div`
  flex: 1;
  
  h3 {
    font-size: 18px;
    margin: 0 0 5px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #a3ffa3;
    text-shadow: 0 0 5px rgba(163, 255, 163, 0.5);
  }
  
  .class {
    font-size: 12px;
    opacity: 0.8;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
`;

const RadiationMeter = styled.div`
  height: 5px;
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #444;
  position: relative;
  
  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => Math.min(100, props.value * 10)}%;
    background: linear-gradient(90deg, 
      rgba(163, 255, 163, 0.7) 0%,
      rgba(255, 255, 163, 0.7) 50%,
      rgba(255, 102, 102, 0.7) 100%
    );
  }
  
  &:after {
    content: "RADIATION";
    position: absolute;
    right: 5px;
    top: -16px;
    font-size: 8px;
    opacity: 0.7;
  }
`;

const StatsPanels = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  
  @media (max-width: 1400px) {
    flex-direction: column;
  }
`;

const StatsPanel = styled.div`
  background: rgba(20, 25, 20, 0.5);
  padding: 8px;
  flex: 1;
  border: 1px solid #444;
  
  h4 {
    font-size: 12px;
    margin: 0 0 8px;
    color: #a3ffa3;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: normal;
    position: relative;
    padding-left: 12px;
    
    &:before {
      content: "//";
      position: absolute;
      left: 0;
      opacity: 0.7;
    }
  }
`;

const StatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  
  .label {
    width: 30px;
    text-align: right;
    opacity: 0.8;
    text-transform: uppercase;
  }
  
  .value {
    width: 20px;
    text-align: right;
  }
`;

const StatBar = styled.div`
  flex: 1;
  height: 4px;
  background: #1a1a1a;
  position: relative;
  
  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => Math.min(100, props.value * 10)}%;
    background: #a3ffa3;
  }
`;

const SkillGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px;
`;

const SkillItem = styled.div`
  background: ${props => props.proficient ? 'rgba(163, 255, 163, 0.1)' : 'transparent'};
  padding: 3px 5px;
  font-size: 10px;
  display: flex;
  justify-content: space-between;
  border: 1px solid ${props => props.proficient ? 'rgba(163, 255, 163, 0.3)' : 'transparent'};
  
  .label {
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 9px;
    opacity: 0.8;
  }
  
  .value {
    color: ${props => props.proficient ? '#a3ffa3' : 'inherit'};
  }
`;

const EquipmentBlock = styled.div`
  background: rgba(20, 25, 20, 0.5);
  padding: 10px;
  border: 1px solid #444;
  margin-bottom: 10px;
  
  h4, h5 {
    font-size: 12px;
    margin: 0 0 8px;
    color: #a3ffa3;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: normal;
    position: relative;
    padding-left: 12px;
    
    &:before {
      content: "//";
      position: absolute;
      left: 0;
      opacity: 0.7;
    }
  }
  
  h5 {
    font-size: 10px;
    margin-top: 10px;
  }
`;

const EquipmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const EquipmentSlot = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px;
  background: rgba(30, 30, 30, 0.4);
  font-size: 11px;
  
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const EquipmentIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  border: 1px solid #444;
  font-size: 8px;
  color: rgba(163, 255, 163, 0.7);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: brightness(1.2) sepia(0.2) hue-rotate(50deg);
  }
`;

const ResourceMeters = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ResourceMeter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  
  .label {
    width: 70px;
    opacity: 0.8;
    text-transform: uppercase;
  }
  
  .value {
    width: 70px;
    text-align: right;
  }
  
  .bar-container {
    flex: 1;
    height: 5px;
    background: #1a1a1a;
    position: relative;
    
    .bar {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: linear-gradient(90deg, #a3ffa3, #66ccff);
    }
  }
`;

const InventoryMini = styled.div`
  margin-top: 10px;
`;

const ScrollableItems = styled.div`
  max-height: 100px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1a1a1a;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #444;
  }
`;

const InventoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(163, 255, 163, 0.1);
  
  .item-name {
    opacity: 0.9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70%;
  }
  
  .item-weight {
    opacity: 0.7;
  }
`;

const EmptyInventory = styled.div`
  font-size: 10px;
  opacity: 0.6;
  font-style: italic;
  text-align: center;
  padding: 10px 0;
`;

const MoreItems = styled.div`
  font-size: 10px;
  opacity: 0.7;
  text-align: center;
  padding: 5px 0;
  font-style: italic;
`;

const EnvironmentStatus = styled.div`
  background: rgba(20, 25, 20, 0.5);
  padding: 10px;
  border: 1px solid #444;
  
  h4 {
    font-size: 12px;
    margin: 0 0 8px;
    color: #a3ffa3;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: normal;
    position: relative;
    padding-left: 12px;
    
    &:before {
      content: "//";
      position: absolute;
      left: 0;
      opacity: 0.7;
    }
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
`;

const StatusCell = styled.div`
  background: rgba(30, 30, 30, 0.4);
  padding: 5px;
  text-align: center;
  
  .label {
    font-size: 9px;
    opacity: 0.8;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  
  .value {
    font-size: 12px;
  }
`;

const PLAYER_AVATARS = [
  './avatars/stalker1.png',
  './avatars/stalker2.png',
  './avatars/stalker3.png',
  './avatars/stalker4.png',
  './avatars/stalker5.png',
  './avatars/stalker6.png'
];

const MONSTER_AVATARS = [
  './avatars/mutant1.png',
  './avatars/mutant2.png',
  './avatars/mutant3.png',
  './avatars/mutant4.png',
  './avatars/mutant5.png',
  './avatars/mutant6.png'
];


const FALLBACK_PLAYER_AVATAR = 'https://placehold.co/100x100/1a2a1a/a3ffa3?text=S';
const FALLBACK_MONSTER_AVATAR = 'https://placehold.co/100x100/2a1a1a/ff9999?text=M';

const diceTypes = [
  { label: 'D2', sides: 2 },
  { label: 'D4', sides: 4 },
  { label: 'D6', sides: 6 },
  { label: 'D8', sides: 8 },
  { label: 'D10', sides: 10 },
  { label: 'D20', sides: 20 },
];

export default function MapPage() {
  const [quantities, setQuantities] = useState(
    diceTypes.reduce((acc, d) => ({ ...acc, [d.label]: 0 }), {})
  );
  const { gameId, characterId } = useParams();
  const [characterData, setCharacterData] = useState(null);
  const [loadingCharacter, setLoadingCharacter] = useState(true);
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [characterPins, setCharacterPins] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('player');
  const pinRefs = useRef({});
  const [results, setResults] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(50);
  const [scale, setScale] = useState(1);
  const [pinTabActive, setPinTabActive] = useState('stalkers');
  const [selectedAvatar, setSelectedAvatar] = useState(PLAYER_AVATARS[0] || FALLBACK_PLAYER_AVATAR);
  const [mapDimensions, setMapDimensions] = useState({ width: 4096, height: 4096 }); 
  const [viewportDimensions, setViewportDimensions] = useState({ 
    width: window.innerWidth * 0.7, 
    height: window.innerHeight 
  });
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);
  

  useEffect(() => {
    setMapOffset({ x: 10, y: 10 });
    setScale(1);
  }, []);
  
  
  useEffect(() => {
    if (mapContainerRef.current) {
      setViewportDimensions({
        width: mapContainerRef.current.clientWidth,
        height: mapContainerRef.current.clientHeight
      });
      
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setViewportDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      });
      
      resizeObserver.observe(mapContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);
  useEffect(() => {
    async function loadCharacterData() {
      if (!characterId) return;
      
      try {
        setLoadingCharacter(true);
        const data = await apiRequest(`/games/${gameId}/characters/${characterId}`);
        setCharacterData(data);
      } catch (err) {
        console.error("Failed to load character data:", err);
      } finally {
        setLoadingCharacter(false);
      }
    }
    
    loadCharacterData();
  }, [gameId, characterId]);

// Update the useEffect function that loads game data

useEffect(() => {
  async function loadGameData() {
    try {
      const gameData = await apiRequest(`/games/${gameId}`);
      setIsGameMaster(gameData.is_dm);
      setCurrentUserRole(gameData.is_dm ? 'dm' : 'player');
      
      const pinsData = await apiRequest(`/games/${gameId}/pins`);
      
      // Check if this is the first time loading and current player doesn't have a pin
      const currentPlayerExists = pinsData.pins.some(pin => 
        pin.character_id === characterId && pin.is_current_user
      );
      
      // Get center of map for default position
      const centerX = mapDimensions.width / 2;
      const centerY = mapDimensions.height / 2;
      
      // If first time for current player, they'll be centered on map
      setCharacterPins(pinsData.pins.map(pin => {
        // For a player joining for the first time, center their token
        const isNewCurrentPlayer = pin.character_id === characterId && 
                                  pin.is_current_user && 
                                  pin.position_x === 500 && 
                                  pin.position_y === 500;
        
        return {
          id: pin.character_id,
          name: pin.name,
          avatar: pin.avatar_url || (pin.is_monster ? FALLBACK_MONSTER_AVATAR : FALLBACK_PLAYER_AVATAR),
          isMonster: pin.is_monster,
          x: isNewCurrentPlayer ? centerX : pin.position_x,
          y: isNewCurrentPlayer ? centerY : pin.position_y
        };
      }));
      
      // If the player is joining for the first time with a centered position,
      // save this position to the backend
      if (!currentPlayerExists && characterId) {
        await apiRequest(`/games/${gameId}/pins/${characterId}/position`, {
          method: 'PUT',
          body: JSON.stringify({
            x: centerX,
            y: centerY
          })
        }).catch(err => console.error("Failed to save initial position:", err));
      }
      
      // Center the map view on the player's character if it exists
      if (characterId) {
        const playerPin = pinsData.pins.find(pin => pin.character_id === characterId);
        if (playerPin && instance) {
          // Apply a slight delay to ensure instance is ready
          setTimeout(() => {
            setTransform(
              -playerPin.position_x + (viewportDimensions.width / 2), 
              -playerPin.position_y + (viewportDimensions.height / 2), 
              1, 
              0
            );
          }, 300);
        }
      }
    } catch (err) {
      console.error("Failed to load game data:", err);
    }
  }
  
  loadGameData();
}, [gameId, characterId, mapDimensions]);
  
// Add these utility functions in the MapPage component

// Helper functions for formatting
const formatStatName = (key) => {
  const statMap = {
    str: 'STR',
    dex: 'DEX',
    int: 'INT',
    wis: 'WIS',
    cha: 'CHA',
    sta: 'STA',
    luk: 'LUK'
  };
  return statMap[key] || key.toUpperCase();
};

const formatSkillName = (key) => {
  // Convert snake_case to normal text and capitalize
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatRadiationColor = (value) => {
  if (value < 1) return '#a3ffa3';
  if (value < 3) return '#a3ffff';
  if (value < 5) return '#ffffa3';
  if (value < 8) return '#ffcc66';
  return '#ff6666';
};

const getProximityColor = (value) => {
  const colorMap = {
    'SAFE': '#a3ffa3',
    'DETECTED': '#ffffa3',
    'NEAR': '#ffcc66',
    'DANGER': '#ff6666'
  };
  return colorMap[value] || '#a3ffa3';
};

const getSafetyColor = (value) => {
  const colorMap = {
    'SECURE': '#a3ffa3',
    'NEUTRAL': '#a3ffff',
    'CONTESTED': '#ffffa3',
    'DANGER': '#ffcc66',
    'HOSTILE': '#ff6666'
  };
  return colorMap[value] || '#a3ffa3';
};

const addCharacterPin = () => {
  const isMonster = pinTabActive === 'monsters';
  const newId = `${isMonster ? 'monster' : 'stalker'}-${Date.now()}`;
  
  // Use map center for new pins
  const centerX = mapDimensions.width / 2;
  const centerY = mapDimensions.height / 2;
  
  setCharacterPins([
    ...characterPins, 
    {
      id: newId,
      name: isMonster ? `Mutant-${characterPins.filter(p => p.isMonster).length + 1}` 
                      : `Stalker-${characterPins.filter(p => !p.isMonster).length + 1}`,
      avatar: selectedAvatar || (isMonster ? FALLBACK_MONSTER_AVATAR : FALLBACK_PLAYER_AVATAR),
      isMonster: isMonster,
      x: centerX,
      y: centerY
    }
  ]);
};
const centerViewOnPin = (pinId, instance) => {
  const pin = characterPins.find(p => p.id === pinId);
  if (!pin || !instance) return;
  
  instance.setTransform(
    -pin.x + (viewportDimensions.width / 2), 
    -pin.y + (viewportDimensions.height / 2), 
    1,
    0 // no animation duration
  );
};

  const removeCharacterPin = (pinId) => {
    setCharacterPins(characterPins.filter(pin => pin.id !== pinId));
  };
  
  const adjustPositionForScale = (position) => {
    return {
      x: position.x,
      y: position.y
    };
  };
  
  const canMovePin = (pinId) => {
    if (isGameMaster) return true; // DM can move any pin
    return pinId === characterId;
  };

  const handlePinDrag = (pinId, data) => {
    if (!canMovePin(pinId)) return;
    
    const adjustedPosition = adjustPositionForScale(data);
    setCharacterPins(characterPins.map(pin => 
      pin.id === pinId ? { ...pin, x: adjustedPosition.x, y: adjustedPosition.y } : pin
    ));
  };
  
  // 3. Update the handlePinStop function to correctly snap to grid
  const handlePinStop = async (pinId) => {
    if (!canMovePin(pinId)) return;
    
    // Find the pin that was moved
    const movedPin = characterPins.find(pin => pin.id === pinId);
    if (!movedPin) return;
    
    let updatedPin = {...movedPin};
    
    // Apply grid snapping if enabled
    if (gridEnabled) {
      const adjustedGridSize = gridSize * scale;
      const cellX = Math.round(movedPin.x / adjustedGridSize);
      const cellY = Math.round(movedPin.y / adjustedGridSize);
      updatedPin.x = cellX * adjustedGridSize;
      updatedPin.y = cellY * adjustedGridSize;
    }
    
    // Update local state
    setCharacterPins(characterPins.map(pin => 
      pin.id === pinId ? updatedPin : pin
    ));
    
    // Save to backend
    try {
      await apiRequest(`/games/${gameId}/pins/${pinId}/position`, {
        method: 'PUT',
        body: JSON.stringify({
          x: updatedPin.x,
          y: updatedPin.y
        })
      });
    } catch (err) {
      console.error("Failed to save pin position:", err);
    }
  };
  
  const renamePinById = (id, newName) => {
    setCharacterPins(
      characterPins.map(pin => 
        pin.id === id ? { ...pin, name: newName } : pin
      )
    );
  };
  
  const changePinAvatar = (id, avatarUrl) => {
    setCharacterPins(
      characterPins.map(pin => 
        pin.id === id ? { ...pin, avatar: avatarUrl } : pin
      )
    );
  };
  const switchPinTab = (tab) => {
    setPinTabActive(tab);
    setSelectedAvatar(tab === 'monsters' ? 
      (MONSTER_AVATARS[0] || FALLBACK_MONSTER_AVATAR) : 
      (PLAYER_AVATARS[0] || FALLBACK_PLAYER_AVATAR)
    );
  };
  const rollDice = () => {
    setRolling(true);
    setResults([]);
    setTimeout(() => {
      const newResults = [];
      diceTypes.forEach(({ label, sides }) => {
        const count = parseInt(quantities[label], 10) || 0;
        for (let i = 0; i < count; i++) {
          newResults.push({ label, value: Math.ceil(Math.random() * sides), id: `${label}-${i}-${Date.now()}` });
        }
      });
      setResults(newResults);
      setRolling(false);
    }, 700);
  };

  return (
    <Container>
      <MapContainer ref={mapContainerRef}>
        <TransformWrapper 
          initialScale={1} 
          minScale={0.5} 
          maxScale={4} 
          wheel={{ step: 0.1, disabled: true }} 
          style={{'height': '100%'}}
          limitToBounds={false} 
          onZoom={() => {
          }}
          onPanning={(ref) => {
            console.log("Panning:", ref.state.positionX, ref.state.positionY);
            setMapOffset({ 
              x: ref.state.positionX, 
              y: ref.state.positionY 
            });
          }}
          panning={{ disabled: false }}
          disablePadding={true}
          doubleClick={{ disabled: true }}
        >
        {({ zoomIn, zoomOut, setTransform, instance }) => {
          useEffect(() => {
            const lastWheelTime = { current: 0 };
            
            const handleWheel = (e) => {
              e.preventDefault();
              
              const now = Date.now();
              if (now - lastWheelTime.current < 50) return; 
              lastWheelTime.current = now;
              
              const currentScale = scale;
              const currentOffsetX = mapOffset.x;
              const currentOffsetY = mapOffset.y;
              
              const zoomFactor = e.deltaY > 0 ? 0.98 : 1.02; 
              const newScale = Math.max(0.5, Math.min(4, currentScale * (e.deltaY > 0 ? 0.98 : 1.02)));
              
              
              if (Math.abs(newScale - currentScale) < 0.01) return;
              
              
              const rect = mapContainerRef.current.getBoundingClientRect();
              
              
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              
              
              const worldX = (mouseX - currentOffsetX) / currentScale;
              const worldY = (mouseY - currentOffsetY) / currentScale;
              
              
              const newOffsetX = mouseX - (worldX * newScale);
              const newOffsetY = mouseY - (worldY * newScale);
              
              
              setTransform(newOffsetX, newOffsetY, newScale, 0);
              
              
              setScale(newScale);
              setMapOffset({
                x: newOffsetX, 
                y: newOffsetY
              });
            };
            
            const container = mapContainerRef.current;
            if (container) {
              container.addEventListener('wheel', handleWheel, { passive: false });
              return () => container.removeEventListener('wheel', handleWheel);
            }
          }, [scale, mapOffset, setTransform]);
          return (
          <>
          
            <TransformComponent  wrapperStyle={{
                height: '100%',
                position: 'relative',
                overflow: 'visible'
              }} 
              contentStyle={{
                height: '100%',
                width: '100%',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1
              }}>
                <TileRenderer
                  viewportWidth={viewportDimensions.width}
                  viewportHeight={viewportDimensions.height}
                  scale={scale}
                  offsetX={mapOffset.x}
                  offsetY={mapOffset.y}
                />
              </div>
              {gridEnabled && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}>
                  <GridOverlay 
                    gridSize={gridSize} 
                    scale={scale} 
                    offsetX={mapOffset.x} 
                    offsetY={mapOffset.y}
                  />
                </div>
              )}
                            
                            <PinContainer>
            {characterPins.map(pin => {
              if (!pinRefs.current[pin.id]) {
                pinRefs.current[pin.id] = React.createRef();
              }
              
              return (
                <Draggable
                  key={pin.id}
                  position={{ x: pin.x, y: pin.y }}
                  onDrag={(e, data) => {
                    e.stopPropagation();
                    if (canMovePin(pin.id)) {
                      handlePinDrag(pin.id, data);
                    }
                  }}
                  onStop={(e) => {
                    e.stopPropagation();
                    handlePinStop(pin.id);
                  }}
                  disabled={!canMovePin(pin.id)}
                  bounds="parent"
                  grid={null}
                  nodeRef={pinRefs.current[pin.id]}
                >
                  {/* existing pin rendering */}
                  <div 
                    ref={pinRefs.current[pin.id]} 
                    style={{
                      position: 'absolute',
                      cursor: canMovePin(pin.id) ? 'grab' : 'not-allowed'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <CharacterPin 
                      size={gridSize * 0.8} 
                      isMonster={pin.isMonster}
                      title={pin.name}
                      isSnapped={gridEnabled}
                      isCurrentPlayer={pin.id === characterId}
                    >
                      <img 
                        src={pin.avatar} 
                        alt={pin.name} 
                        onError={(e) => {
                          e.target.src = pin.isMonster ? FALLBACK_MONSTER_AVATAR : FALLBACK_PLAYER_AVATAR;
                        }}
                      />
                      <span>{pin.name}</span>
                    </CharacterPin>
                  </div>
                </Draggable>
              );
            })}
          </PinContainer>
              </TransformComponent>
              
            </>
          );
        }}
        </TransformWrapper>
        {}
        <GridControl>
          <h3>Grid Controls</h3>
          <ControlRow>
            <span>Grid:</span>
            <Button 
              onClick={() => setGridEnabled(!gridEnabled)}
              style={{ width: 'auto', padding: '5px 10px' }}
            >
              {gridEnabled ? 'Disable' : 'Enable'}
            </Button>
          </ControlRow>
          <ControlRow>
            <span>Cell Size:</span>
            <NumberInput
              type="number"
              min="20"
              max="100"
              value={gridSize}
              onChange={e => setGridSize(parseInt(e.target.value) || 50)}
            />
          </ControlRow>
        </GridControl>
        
        {}
        <ScaleLegend>
          <ScaleLine />
          <span>{Math.round(100 / scale)}m</span>
        </ScaleLegend>
        <DicePanel>
          <h3>Tactical Dice Roller</h3>
          <DiceGrid>
            {diceTypes.map(({ label }) => (
              <React.Fragment key={label}>
                <span>{label}</span>
                <NumberInput
                  type="number"
                  min="0"
                  value={quantities[label]}
                  onChange={e => setQuantities({ ...quantities, [label]: e.target.value })}
                />
              </React.Fragment>
            ))}
          </DiceGrid>
          <Button onClick={rollDice} disabled={rolling}>
            {rolling ? 'Processing...' : 'Roll Dice'}
          </Button>
          <ResultsGrid>
            <AnimatePresence>
              {results.map(r => (
                <DiceResult
                  key={r.id}
                  initial={{ scale: 0, opacity: 0, rotateZ: 180 }}
                  animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  {r.value}
                </DiceResult>
              ))}
            </AnimatePresence>
          </ResultsGrid>
        </DicePanel>

        <PinPanel>
          <h3>Tactical Tokens</h3>
          <PinTabs>
            <PinTab 
              active={pinTabActive === 'stalkers'} 
              onClick={() => switchPinTab('stalkers')}
            >
              Stalkers
            </PinTab>
            <PinTab 
              active={pinTabActive === 'monsters'} 
              onClick={() => switchPinTab('monsters')}
            >
              Mutants
            </PinTab>
          </PinTabs>
          
          {}
          <AvatarSelector isMonster={pinTabActive === 'monsters'}>
            {(pinTabActive === 'stalkers' ? PLAYER_AVATARS : MONSTER_AVATARS).map((avatar, i) => (
              <div 
                key={i} 
                className={selectedAvatar === avatar ? 'selected' : ''}
                onClick={() => setSelectedAvatar(avatar)}
              >
                <img 
                  src={avatar} 
                  alt={`Avatar ${i+1}`}
                  onError={(e) => {
                    e.target.src = pinTabActive === 'monsters' ? FALLBACK_MONSTER_AVATAR : FALLBACK_PLAYER_AVATAR;
                  }}
                />
              </div>
            ))}
          </AvatarSelector>
          
          {}
          <AddPinButton 
            onClick={addCharacterPin}
            isMonster={pinTabActive === 'monsters'}
          >
            <Plus size={16} />
            Add {pinTabActive === 'stalkers' ? 'Stalker' : 'Mutant'}
          </AddPinButton>
          
          {}
          <div style={{ marginTop: '15px' }}>
            {characterPins
              .filter(pin => pin.isMonster === (pinTabActive === 'monsters'))
              .map(pin => (
                <PinItem key={pin.id}>
                  <PinAvatar isMonster={pin.isMonster}>
                    <img 
                      src={pin.avatar} 
                      alt={pin.name}
                      onError={(e) => {
                        e.target.src = pin.isMonster ? FALLBACK_MONSTER_AVATAR : FALLBACK_PLAYER_AVATAR;
                      }}
                    />
                  </PinAvatar>
                  <PinNameInput
                    value={pin.name}
                    onChange={(e) => renamePinById(pin.id, e.target.value)}
                    isMonster={pin.isMonster}
                  />
                  <PinControls>
                    <PinButton onClick={() => removeCharacterPin(pin.id)}>X</PinButton>
                    <PinButton onClick={() => centerViewOnPin(pin.id, instance)}>Center</PinButton>
                    <PinButton onClick={() => removeCharacterPin(pin.id)}>X</PinButton>
                  </PinControls>
                </PinItem>
              ))}
            {characterPins.filter(pin => pin.isMonster === (pinTabActive === 'monsters')).length === 0 && (
              <div style={{ textAlign: 'center', opacity: 0.7, marginTop: '20px' }}>
                No {pinTabActive === 'stalkers' ? 'stalkers' : 'mutants'} added
              </div>
            )}
          </div>
        </PinPanel>
  
        <MenuBtn>
          <Menu 
            size={32}
            onClick={() => setMenuOpen(o => !o)} 
            style={{ cursor: 'pointer' }}
          />
          {menuOpen && (
            <MenuList>
              <ul>
                <li><Link to="/">MAIN TERMINAL</Link></li>
                <li><Link to="/inventory">INVENTORY</Link></li>
                <li><Link to="/map">ZONE MAP</Link></li>
                <li><Link to="/journal">JOURNAL</Link></li>
              </ul>
            </MenuList>
          )}
        </MenuBtn>
      </MapContainer>
      


<AvatarPanel>
  <PanelHeader>STALKER PROFILE</PanelHeader>
  
  {loadingCharacter ? (
    <LoadingIndicator>
      <span>Loading character data...</span>
      <div className="scanner-line"></div>
    </LoadingIndicator>
  ) : !characterData ? (
    <NoCharacterData>
      No character data available
    </NoCharacterData>
  ) : (
    <>
      <CharacterHeader>
        <CharacterAvatar>
          <img 
            src={characterData.avatar_url || FALLBACK_PLAYER_AVATAR} 
            alt={characterData.name}
            onError={(e) => { e.target.src = FALLBACK_PLAYER_AVATAR; }}
          />
          <StatusIndicator active={true} />
        </CharacterAvatar>
        
        <CharacterNameplate>
          <h3>{characterData.name}</h3>
          <div className="class">{characterData.class}</div>
          <RadiationMeter value={characterData.radiation || 0} />
        </CharacterNameplate>
      </CharacterHeader>
      
      <StatsPanels>
        <StatsPanel>
          <h4>ATTRIBUTES</h4>
          <StatsList>
            {characterData.stats && Object.entries(characterData.stats).map(([key, value]) => (
              <StatItem key={key}>
                <span className="label">{formatStatName(key)}</span>
                <StatBar value={value} />
                <span className="value">{value}</span>
              </StatItem>
            ))}
          </StatsList>
        </StatsPanel>
        
        <StatsPanel>
          <h4>SKILLS</h4>
          <SkillGrid>
            {characterData.profs && Object.entries(characterData.profs)
              .slice(0, 6) // Show only top skills to save space
              .sort(([,a], [,b]) => b - a)
              .map(([key, value]) => (
                <SkillItem key={key} proficient={value > 0}>
                  <span className="label">{formatSkillName(key)}</span>
                  <span className="value">{value > 0 ? `+${value}` : value}</span>
                </SkillItem>
              ))}
          </SkillGrid>
        </StatsPanel>
      </StatsPanels>
      
      <EquipmentBlock>
        <h4>EQUIPMENT STATUS</h4>
        <EquipmentGrid>
          <EquipmentSlot type="headgear">
            <EquipmentIcon>{characterData.equipment?.headgear ? 
              <img src={`./equipment/${characterData.equipment.headgear.icon || 'helmet.png'}`} alt="Headgear" /> : 
              'HEAD'
            }</EquipmentIcon>
            <span>{characterData.equipment?.headgear?.name || '-'}</span>
          </EquipmentSlot>
          
          <EquipmentSlot type="armor">
            <EquipmentIcon>{characterData.equipment?.armor ? 
              <img src={`./equipment/${characterData.equipment.armor.icon || 'armor.png'}`} alt="Armor" /> : 
              'BODY'
            }</EquipmentIcon>
            <span>{characterData.equipment?.armor?.name || '-'}</span>
          </EquipmentSlot>
          
          <EquipmentSlot type="primary">
            <EquipmentIcon>{characterData.equipment?.primary ? 
              <img src={`./equipment/${characterData.equipment.primary.icon || 'weapon.png'}`} alt="Primary" /> : 
              'PRI'
            }</EquipmentIcon>
            <span>{characterData.equipment?.primary?.name || '-'}</span>
          </EquipmentSlot>
          
          <EquipmentSlot type="secondary">
            <EquipmentIcon>{characterData.equipment?.secondary ? 
              <img src={`./equipment/${characterData.equipment.secondary.icon || 'backpack.png'}`} alt="Secondary" /> : 
              'SEC'
            }</EquipmentIcon>
            <span>{characterData.equipment?.secondary?.name || '-'}</span>
          </EquipmentSlot>
        </EquipmentGrid>
        
        <ResourceMeters>
          <ResourceMeter>
            <div className="label">MONEY</div>
            <div className="value">{characterData.money || 0} ₽</div>
          </ResourceMeter>
          
          <ResourceMeter>
            <div className="label">CAPACITY</div>
            <div className="bar-container">
              <div 
                className="bar" 
                style={{
                  width: `${Math.min(100, (characterData.inventory?.reduce((acc, item) => acc + (item.weight || 0), 0) / characterData.capacity) * 100) || 0}%`
                }}
              ></div>
            </div>
            <div className="value">
              {characterData.inventory?.reduce((acc, item) => acc + (item.weight || 0), 0) || 0}/{characterData.capacity || 0}
            </div>
          </ResourceMeter>
        </ResourceMeters>
        
        <InventoryMini>
          <h5>INVENTORY ({characterData.inventory?.length || 0})</h5>
          <ScrollableItems>
            {characterData.inventory && characterData.inventory.length > 0 ? (
              characterData.inventory.slice(0, 5).map((item, index) => (
                <InventoryItem key={index}>
                  <div className="item-name">{item.name}</div>
                  <div className="item-weight">{item.weight}kg</div>
                </InventoryItem>
              ))
            ) : (
              <EmptyInventory>Empty inventory</EmptyInventory>
            )}
            {characterData.inventory && characterData.inventory.length > 5 && (
              <MoreItems>+ {characterData.inventory.length - 5} more items</MoreItems>
            )}
          </ScrollableItems>
        </InventoryMini>
      </EquipmentBlock>
      
      <EnvironmentStatus>
        <h4>ENVIRONMENT</h4>
        <StatusGrid>
          <StatusCell>
            <div className="label">RADS</div>
            <div className="value" style={{color: formatRadiationColor(characterData.radiation || 0)}}>
              {characterData.radiation || 0} mSv
            </div>
          </StatusCell>
          <StatusCell>
            <div className="label">ANOMALIES</div>
            <div className="value" style={{color: getProximityColor(characterData.anomaly_proximity || 'SAFE')}}>
              {characterData.anomaly_proximity || 'SAFE'}
            </div>
          </StatusCell>
          <StatusCell>
            <div className="label">SAFETY</div>
            <div className="value" style={{color: getSafetyColor(characterData.safety_level || 'SECURE')}}>
              {characterData.safety_level || 'SECURE'}
            </div>
          </StatusCell>
        </StatusGrid>
      </EnvironmentStatus>
    </>
  )}
</AvatarPanel>
    </Container>
  );}