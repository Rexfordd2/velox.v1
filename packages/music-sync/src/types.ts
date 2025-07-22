export interface Beat {
  timestamp: number;  // ms
  type: 'strong' | 'weak';
}

export interface Rep {
  timestamp: number;  // ms
  type: 'concentric' | 'eccentric';
} 