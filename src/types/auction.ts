export type AuctionStatus = 'draft' | 'scheduled' | 'live' | 'paused' | 'completed';
export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
export type PlayerStatus = 'upcoming' | 'current' | 'sold' | 'unsold';
export type AuctionRound = 'regular' | 'unsold';

export interface PreAuctionPhoto {
  id: string;
  url: string;
  title: string;
  category: 'champion' | 'team_logo' | 'custom';
  caption?: string;
}

export interface Auction {
  id: string;
  name: string;
  date: string;
  time: string;
  status: AuctionStatus;
  adminUid: string;
  adminEmail: string;
  scheduledStartTime?: string;
  round?: AuctionRound;
  preAuctionPhotos?: PreAuctionPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  auctionId: string;
  name: string;
  logoUrl: string;
  purse: number;
  remainingPurse: number;
  totalSpent: number;
  purchasedPlayerCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Player {
  id: string;
  auctionId: string;
  name: string;
  role: PlayerRole;
  photoUrl: string;
  basePoints: number;
  status: PlayerStatus;
  soldPoints?: number;
  soldToTeamId?: string;
  soldToTeamName?: string;
  soldToTeamLogo?: string;
  order: number;
  round: AuctionRound;
  slotNumber?: number;
  slotName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuctionState {
  id: string;
  auctionId: string;
  auctionName: string;
  status: AuctionStatus;
  round: AuctionRound;
  currentPlayerId: string | null;
  currentPlayerName?: string;
  currentPlayerRole?: PlayerRole;
  currentPlayerPhoto?: string;
  currentPlayerBasePoints?: number;
  currentPlayerSlotNumber?: number;
  currentPlayerSlotName?: string;
  playerStatus: 'idle' | 'bidding' | 'sold' | 'unsold';
  currentBidPoints: number;
  winningTeamId: string | null;
  winningTeamName: string | null;
  winningTeamLogo: string | null;
  winningTeamRemainingPurse: number | null;
  lastSoldPlayerName?: string;
  lastSoldPlayerPhoto?: string;
  lastSoldPoints?: number;
  lastSoldTeamName?: string;
  lastSoldTeamLogo?: string;
  lastUnsoldPlayerName?: string;
  lastUnsoldPlayerPhoto?: string;
  lastUnsoldPlayerRole?: PlayerRole;
  lastUnsoldBasePoints?: number;
  updatedAt: string;
}
