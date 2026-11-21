import * as XLSX from 'xlsx';
import type { Auction, Team, Player } from '../types/auction';

function sanitizeSheetName(raw: string, usedNames: Set<string>): string {
  // Excel sheet names: max 31 chars, cannot contain : \ / ? * [ ]
  const cleaned = (raw || 'Sheet')
    .replace(/[:\\/?*[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 31) || 'Sheet';

  let candidate = cleaned;
  let suffix = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    const tag = ` (${suffix})`;
    candidate = `${cleaned.slice(0, 31 - tag.length)}${tag}`;
    suffix++;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function autoFitColumns(rows: (string | number | null | undefined)[][]): XLSX.ColInfo[] {
  const maxLengths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, colIdx) => {
      const len = cell === null || cell === undefined ? 0 : String(cell).length;
      if (!maxLengths[colIdx] || len > maxLengths[colIdx]) {
        maxLengths[colIdx] = len;
      }
    });
  }
  return maxLengths.map((len) => ({ wch: Math.min(Math.max(len + 4, 12), 42) }));
}

function getSlotText(player: Player): string {
  if (player.slotName && player.slotName.trim()) return player.slotName.trim();
  if (player.slotNumber) return `Slot ${player.slotNumber}`;
  return player.round === 'unsold' ? 'Unsold Pool' : 'Slot 1';
}

function getTeamPlayers(team: Team, players: Player[]): Player[] {
  const teamNameNorm = (team.name || '').trim().toLowerCase();
  return players
    .filter(
      (p) =>
        p.status === 'sold' &&
        (p.soldToTeamId === team.id ||
          (teamNameNorm && (p.soldToTeamName || '').trim().toLowerCase() === teamNameNorm))
    )
    .sort((a, b) => (b.soldPoints ?? b.basePoints) - (a.soldPoints ?? a.basePoints));
}

export function exportAuctionResultsToExcel(
  auction: Auction | null,
  teams: Team[],
  players: Player[]
): void {
  const wb = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  const teamNameById = new Map<string, string>();
  for (const t of teams) {
    teamNameById.set(t.id, t.name);
  }

  const soldPlayers = players
    .filter((p) => p.status === 'sold')
    .sort((a, b) => (b.soldPoints ?? b.basePoints) - (a.soldPoints ?? a.basePoints));
  const unsoldPlayers = players
    .filter((p) => p.status === 'unsold')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const upcomingPlayers = players
    .filter((p) => p.status !== 'sold' && p.status !== 'unsold')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const totalSpentAll = teams.reduce(
    (sum, t) => sum + (typeof t.totalSpent === 'number' ? t.totalSpent : Math.max(0, (t.purse || 0) - (t.remainingPurse || 0))),
    0
  );
  const totalRemainingAll = teams.reduce(
    (sum, t) => sum + (typeof t.remainingPurse === 'number' ? t.remainingPurse : (t.purse || 0)),
    0
  );

  // 1. SUMMARY & TEAM STANDINGS SHEET
  const summaryRows: (string | number)[][] = [
    ['ZPL AUCTION - OFFICIAL RESULT REPORT'],
    ['Tournament', auction?.name || 'ZPL Player Auction'],
    ['Date', auction?.date || '-'],
    ['Time', auction?.time || '-'],
    ['Status', (auction?.status || 'live').toUpperCase()],
    ['Exported At', new Date().toLocaleString()],
    [],
    ['AUCTION OVERVIEW', 'VALUE'],
    ['Total Franchises', teams.length],
    ['Total Players Registered', players.length],
    ['Players Sold', soldPlayers.length],
    ['Players Unsold', unsoldPlayers.length],
    ['Players Remaining / Upcoming', upcomingPlayers.length],
    ['Total Points Spent (PTS)', totalSpentAll],
    ['Total Remaining Purse (PTS)', totalRemainingAll],
    [],
    ['FRANCHISE SUMMARY'],
    [
      'Sr No',
      'Franchise Name',
      'Total Purse (PTS)',
      'Total Spent (PTS)',
      'Remaining Purse (PTS)',
      'Players Bought',
      'Highest Buy (PTS)',
      'Average Price (PTS)'
    ]
  ];

  const sortedTeams = [...teams].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
  sortedTeams.forEach((team, idx) => {
    const roster = getTeamPlayers(team, players);
    const totalPurse = team.purse ?? 0;
    const remainingPurse = team.remainingPurse ?? totalPurse;
    const spent = typeof team.totalSpent === 'number' ? team.totalSpent : Math.max(0, totalPurse - remainingPurse);
    const count = roster.length > 0 ? roster.length : (team.purchasedPlayerCount ?? 0);
    const highestBuy = roster.length > 0 ? Math.max(...roster.map((p) => p.soldPoints ?? p.basePoints)) : 0;
    const avgPrice = count > 0 ? Math.round(spent / count) : 0;

    summaryRows.push([
      idx + 1,
      team.name,
      totalPurse,
      spent,
      remainingPurse,
      count,
      highestBuy,
      avgPrice
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = autoFitColumns(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, sanitizeSheetName('Summary', usedSheetNames));

  // 2. SOLD PLAYERS SHEET
  const soldRows: (string | number)[][] = [
    [
      'Sr No',
      'Player Name',
      'Role',
      'Slot / Pool',
      'Base Price (PTS)',
      'Winning Franchise',
      'Final Sold Price (PTS)',
      'Bid Gain Over Base (PTS)'
    ]
  ];

  soldPlayers.forEach((p, idx) => {
    const finalPrice = p.soldPoints ?? p.basePoints;
    const teamName =
      p.soldToTeamName || (p.soldToTeamId ? teamNameById.get(p.soldToTeamId) : '') || 'Assigned Franchise';
    soldRows.push([
      idx + 1,
      p.name,
      p.role,
      getSlotText(p),
      p.basePoints,
      teamName,
      finalPrice,
      Math.max(0, finalPrice - p.basePoints)
    ]);
  });

  if (soldPlayers.length > 0) {
    soldRows.push([]);
    soldRows.push([
      '',
      'TOTAL SOLD',
      '',
      '',
      soldPlayers.reduce((s, p) => s + (p.basePoints || 0), 0),
      `${soldPlayers.length} Players`,
      soldPlayers.reduce((s, p) => s + (p.soldPoints ?? p.basePoints ?? 0), 0),
      ''
    ]);
  }

  const wsSold = XLSX.utils.aoa_to_sheet(soldRows);
  wsSold['!cols'] = autoFitColumns(soldRows);
  XLSX.utils.book_append_sheet(wb, wsSold, sanitizeSheetName('Sold Players', usedSheetNames));

  // 3. UNSOLD PLAYERS SHEET
  const unsoldRows: (string | number)[][] = [
    ['Sr No', 'Player Name', 'Role', 'Slot / Pool', 'Base Price (PTS)', 'Status']
  ];

  unsoldPlayers.forEach((p, idx) => {
    unsoldRows.push([idx + 1, p.name, p.role, getSlotText(p), p.basePoints, 'UNSOLD']);
  });

  const wsUnsold = XLSX.utils.aoa_to_sheet(unsoldRows);
  wsUnsold['!cols'] = autoFitColumns(unsoldRows);
  XLSX.utils.book_append_sheet(wb, wsUnsold, sanitizeSheetName('Unsold Players', usedSheetNames));

  // 4. ALL PLAYERS MASTER SHEET
  const allOrdered = [...soldPlayers, ...unsoldPlayers, ...upcomingPlayers];
  const allRows: (string | number)[][] = [
    [
      'Sr No',
      'Player Name',
      'Role',
      'Slot / Pool',
      'Base Price (PTS)',
      'Status',
      'Winning Franchise',
      'Sold Price (PTS)'
    ]
  ];

  allOrdered.forEach((p, idx) => {
    const isSold = p.status === 'sold';
    const teamName = isSold
      ? p.soldToTeamName || (p.soldToTeamId ? teamNameById.get(p.soldToTeamId) : '') || '-'
      : '-';
    allRows.push([
      idx + 1,
      p.name,
      p.role,
      getSlotText(p),
      p.basePoints,
      p.status.toUpperCase(),
      teamName,
      isSold ? (p.soldPoints ?? p.basePoints) : ''
    ]);
  });

  const wsAll = XLSX.utils.aoa_to_sheet(allRows);
  wsAll['!cols'] = autoFitColumns(allRows);
  XLSX.utils.book_append_sheet(wb, wsAll, sanitizeSheetName('All Players', usedSheetNames));

  // 5. INDIVIDUAL FRANCHISE SQUAD SHEETS
  sortedTeams.forEach((team) => {
    const roster = getTeamPlayers(team, players);
    const totalPurse = team.purse ?? 0;
    const remainingPurse = team.remainingPurse ?? totalPurse;
    const spent = typeof team.totalSpent === 'number' ? team.totalSpent : Math.max(0, totalPurse - remainingPurse);

    const teamRows: (string | number)[][] = [
      ['FRANCHISE SQUAD SHEET'],
      ['Franchise Name', team.name],
      ['Total Purse (PTS)', totalPurse],
      ['Total Spent (PTS)', spent],
      ['Remaining Purse (PTS)', remainingPurse],
      ['Players Acquired', roster.length],
      [],
      ['Sr No', 'Player Name', 'Role', 'Slot / Pool', 'Base Price (PTS)', 'Purchase Price (PTS)']
    ];

    roster.forEach((p, idx) => {
      teamRows.push([
        idx + 1,
        p.name,
        p.role,
        getSlotText(p),
        p.basePoints,
        p.soldPoints ?? p.basePoints
      ]);
    });

    if (roster.length === 0) {
      teamRows.push(['', 'No players acquired yet', '', '', '', '']);
    } else {
      teamRows.push([]);
      teamRows.push([
        '',
        'SQUAD TOTAL',
        `${roster.length} Players`,
        '',
        roster.reduce((s, p) => s + (p.basePoints || 0), 0),
        roster.reduce((s, p) => s + (p.soldPoints ?? p.basePoints ?? 0), 0)
      ]);
    }

    const wsTeam = XLSX.utils.aoa_to_sheet(teamRows);
    wsTeam['!cols'] = autoFitColumns(teamRows);
    XLSX.utils.book_append_sheet(wb, wsTeam, sanitizeSheetName(team.name, usedSheetNames));
  });

  // Trigger clean .xlsx download
  const safeFileBase = (auction?.name || 'ZPL_Auction_Results')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50) || 'ZPL_Auction_Results';
  const dateTag = new Date().toISOString().slice(0, 10);
  const fileName = `${safeFileBase}_Results_${dateTag}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
