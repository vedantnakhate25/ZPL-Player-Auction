import { doc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import type { Auction, Team, Player, AuctionState } from '../types/auction';

export const SAMPLE_TEAMS = [
  {
    name: 'Mumbai Warriors',
    logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&auto=format&fit=crop&q=80',
    purse: 1000,
  },
  {
    name: 'Bangalore Blasters',
    logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
    purse: 1000,
  },
  {
    name: 'Chennai Strikers',
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&auto=format&fit=crop&q=80',
    purse: 1000,
  },
  {
    name: 'Delhi Titans',
    logoUrl: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=200&auto=format&fit=crop&q=80',
    purse: 1000,
  }
];

export const SAMPLE_PLAYERS = [
  {
    name: 'Rahul Patil',
    role: 'Batsman' as const,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    basePoints: 50,
  },
  {
    name: 'Jasprit Shinde',
    role: 'Bowler' as const,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    basePoints: 80,
  },
  {
    name: 'Hardik Verma',
    role: 'All-Rounder' as const,
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    basePoints: 75,
  },
  {
    name: 'Rishabh Kulkarni',
    role: 'Wicket-Keeper' as const,
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
    basePoints: 60,
  },
  {
    name: 'Virat Deshmukh',
    role: 'Batsman' as const,
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    basePoints: 100,
  },
  {
    name: 'Rashid Khanzada',
    role: 'Bowler' as const,
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
    basePoints: 70,
  },
  {
    name: 'Benjamin Rao',
    role: 'All-Rounder' as const,
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80',
    basePoints: 85,
  },
  {
    name: 'Lokesh Joshi',
    role: 'Wicket-Keeper' as const,
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80',
    basePoints: 65,
  }
];

export async function createSampleAuction(adminUid: string, adminEmail: string): Promise<string> {
  const auctionId = 'zpl-premier-2027';
  const now = new Date().toISOString();

  try {
    // 1. Create Auction Doc
    const auctionRef = doc(db, 'auctions', auctionId);
    const auctionData: Auction = {
      id: auctionId,
      name: 'ZPL 2027 - Zhep Premier League Player Auction',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      status: 'scheduled',
      adminUid,
      adminEmail,
      round: 'regular',
      preAuctionPhotos: [
        {
          id: 'sample-champion-2025',
          title: '2025 Defending Champions 🏆',
          category: 'champion',
          url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
          caption: 'Shivaji Super Kings - Reigning Champions of ZPL Zhep Premier League'
        },
        {
          id: 'sample-team-1',
          title: 'Shivaji Super Kings',
          category: 'team_logo',
          url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
          caption: 'Defending Champions • 1,000 PTS Purse'
        },
        {
          id: 'sample-team-2',
          title: 'Raigad Royals',
          category: 'team_logo',
          url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&auto=format&fit=crop&q=80',
          caption: '2027 Season Contender • 1,000 PTS Purse'
        },
        {
          id: 'sample-team-3',
          title: 'Sinhagad Strikers',
          category: 'team_logo',
          url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
          caption: '2027 Season Contender • 1,000 PTS Purse'
        },
        {
          id: 'sample-team-4',
          title: 'Pratapgad Panthers',
          category: 'team_logo',
          url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
          caption: '2027 Season Contender • 1,000 PTS Purse'
        }
      ],
      createdAt: now,
      updatedAt: now
    };
    await setDoc(auctionRef, auctionData);

    // 2. Create Teams
    const teamIds: string[] = [];
    for (let i = 0; i < SAMPLE_TEAMS.length; i++) {
      const t = SAMPLE_TEAMS[i];
      const teamId = `team-${i + 1}`;
      teamIds.push(teamId);
      const teamRef = doc(db, 'teams', teamId);
      const teamData: Team = {
        id: teamId,
        auctionId,
        name: t.name,
        logoUrl: t.logoUrl,
        purse: t.purse,
        remainingPurse: t.purse,
        totalSpent: 0,
        purchasedPlayerCount: 0,
        createdAt: now
      };
      await setDoc(teamRef, teamData);
    }

    // 3. Create Players
    const firstPlayer = SAMPLE_PLAYERS[0];
    const firstPlayerId = 'player-1';

    for (let i = 0; i < SAMPLE_PLAYERS.length; i++) {
      const p = SAMPLE_PLAYERS[i];
      const playerId = `player-${i + 1}`;
      const playerRef = doc(db, 'players', playerId);
      const playerData: Player = {
        id: playerId,
        auctionId,
        name: p.name,
        role: p.role,
        photoUrl: p.photoUrl,
        basePoints: p.basePoints,
        status: i === 0 ? 'current' : 'upcoming',
        order: i + 1,
        round: 'regular',
        createdAt: now
      };
      await setDoc(playerRef, playerData);
    }

    // 4. Create AuctionState Doc
    const stateRef = doc(db, 'auctionState', auctionId);
    const stateData: AuctionState = {
      id: auctionId,
      auctionId,
      auctionName: 'Premier Cricket Auction 2027',
      status: 'live',
      round: 'regular',
      currentPlayerId: firstPlayerId,
      currentPlayerName: firstPlayer.name,
      currentPlayerRole: firstPlayer.role,
      currentPlayerPhoto: firstPlayer.photoUrl,
      currentPlayerBasePoints: firstPlayer.basePoints,
      playerStatus: 'bidding',
      currentBidPoints: firstPlayer.basePoints,
      winningTeamId: null,
      winningTeamName: null,
      winningTeamLogo: null,
      winningTeamRemainingPurse: null,
      updatedAt: now
    };
    await setDoc(stateRef, stateData);

    return auctionId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `auctions/${auctionId}`);
    throw error;
  }
}
