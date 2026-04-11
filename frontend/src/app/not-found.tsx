'use client';

import { Box, Button, Container, Group, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconSearchOff } from '@tabler/icons-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--cl-bg)',
        display: 'flex',
        alignItems: 'center',
        padding: '2rem',
      }}
    >
      <Container size="sm" style={{ textAlign: 'center' }}>
        <Box
          style={{
            width: 80,
            height: 80,
            borderRadius: '24px',
            backgroundColor: 'var(--cl-brand-soft)',
            color: 'var(--cl-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
          }}
        >
          <IconSearchOff size={40} />
        </Box>
        
        <Title
          style={{
            fontSize: '3.5rem',
            fontWeight: 700,
            color: 'var(--cl-text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
          }}
        >
          404 - Page not found
        </Title>
        
        <Text
          size="lg"
          style={{
            color: 'var(--cl-text-secondary)',
            marginBottom: '2.5rem',
            lineHeight: 1.6,
          }}
        >
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back to browsing.
        </Text>
        
        <Group justify="center">
          <Button
            component={Link}
            href="/"
            variant="brand"
            size="lg"
            radius={9999}
            leftSection={<IconArrowLeft size={18} />}
            style={{ fontWeight: 600, height: 52, paddingInline: 28 }}
          >
            Return to Homepage
          </Button>
        </Group>
      </Container>
    </Box>
  );
}
