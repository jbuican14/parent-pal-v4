import React from 'react';
import { colors, typography, spacing } from '../tokens/tokens';

export default function Children() {
  return (
    <div style={{ 
      flex: 1, 
      backgroundColor: '#F9FAFB',
      padding: '20px',
    }}>
      <h1 style={{
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
      }}>
        Children
      </h1>
      <p style={{ color: colors.textSecondary }}>
        Children page content coming soon...
      </p>
    </div>
  );
}
