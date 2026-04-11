'use client';
/**
 * ClickLess AI – Account & Profile Page
 */
import { useState, useRef } from 'react';
import {
  Box, Stack, Text, TextInput, PasswordInput, Button,
  Avatar, Group, Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconCamera } from '@tabler/icons-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/sessionSlice';

// ── Password strength helpers ─────────────────────────────────────────────────

function calcStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_COLORS = ['var(--cl-error)', 'var(--cl-warning)', '#EAB308', 'var(--cl-success)'];
const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];

function PasswordStrengthBar({ password }: { password: string }) {
  const score = calcStrength(password);
  if (!password) return null;
  const color = STRENGTH_COLORS[score - 1] ?? 'var(--cl-border)';
  const label = STRENGTH_LABELS[score - 1] ?? '';
  return (
    <Box style={{ marginTop: 8 }}>
      <Group gap={4} style={{ marginBottom: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 99,
              backgroundColor: i < score ? color : 'var(--cl-border)',
              transition: 'background-color 0.2s ease',
            }}
          />
        ))}
      </Group>
      <Text size="xs" style={{ color }}>
        {label}
      </Text>
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.session.user);

  // Profile section
  const [nameValue, setNameValue] = useState(user?.name ?? '');
  const [avatarSrc, setAvatarSrc] = useState<string | null>(user?.image ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password section
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarSrc(url);
    dispatch(updateUser({ image: url }));
  }

  function handleSaveProfile() {
    dispatch(updateUser({ name: nameValue }));
    notifications.show({
      title: 'Profile updated',
      message: 'Your name has been saved.',
      color: 'teal',
    });
  }

  function handleUpdatePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      notifications.show({ title: 'Error', message: 'Please fill in all password fields.', color: 'red' });
      return;
    }
    if (newPw === currentPw) {
      notifications.show({ title: 'Error', message: 'New password must differ from current password.', color: 'red' });
      return;
    }
    if (newPw !== confirmPw) {
      notifications.show({ title: 'Error', message: 'Passwords do not match.', color: 'red' });
      return;
    }
    // In real app, call API here
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    notifications.show({ title: 'Password updated', message: 'Your password has been changed.', color: 'teal' });
  }

  function handleDeleteAccount() {
    modals.openConfirmModal({
      title: 'Delete account',
      centered: true,
      children: (
        <Text size="sm" style={{ color: 'var(--cl-text-secondary)' }}>
          Are you sure you want to delete your account? This action is permanent and cannot be undone.
          All your data, sessions, and order history will be erased.
        </Text>
      ),
      labels: { confirm: 'Yes, delete my account', cancel: 'Cancel' },
      confirmProps: { color: 'red', variant: 'filled' },
      onConfirm: () => {
        notifications.show({ title: 'Account deleted', message: 'Your account has been removed.', color: 'red' });
      },
    });
  }

  const newPwMismatch  = confirmPw.length > 0 && newPw !== confirmPw;
  const newPwSameCurrent = newPw.length > 0 && newPw === currentPw;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '28px 32px',
        height: 'calc(100vh - 52px)',
        overflowY: 'auto',
      }}
    >
      <Stack gap={24}>

        {/* ── Section 1: Profile ───────────────────────────────────────────── */}
        <Box
          style={{
            backgroundColor: 'var(--cl-surface)',
            border: '1px solid var(--cl-border)',
            borderRadius: 20,
            padding: 28,
          }}
        >
          <Text fw={600} size="md" style={{ color: 'var(--cl-text-primary)', marginBottom: 20 }}>
            Profile
          </Text>

          {/* Avatar upload row */}
          <Group gap={16} style={{ marginBottom: 24 }}>
            <Box style={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={avatarSrc}
                size={80}
                radius="50%"
                style={{
                  border: '2px solid var(--cl-border)',
                  backgroundColor: 'var(--cl-brand-soft)',
                  color: 'var(--cl-brand)',
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {!avatarSrc && (user?.name?.[0]?.toUpperCase() ?? 'U')}
              </Avatar>

              {/* Camera overlay */}
              <Box
                component="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  backgroundColor: 'var(--cl-brand)',
                  border: '2px solid var(--cl-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
                aria-label="Upload photo"
              >
                <IconCamera size={13} color="white" />
              </Box>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarFile}
              />
            </Box>

            <Box>
              <Text fw={500} size="sm" style={{ color: 'var(--cl-text-primary)' }}>
                {user?.name ?? 'Your name'}
              </Text>
              <Text size="xs" style={{ color: 'var(--cl-text-muted)', marginTop: 2 }}>
                Click the camera icon to upload a new photo
              </Text>
            </Box>
          </Group>

          {/* Name input */}
          <TextInput
            label="Display name"
            value={nameValue}
            onChange={(e) => setNameValue(e.currentTarget.value)}
            style={{ marginBottom: 14 }}
            styles={{
              label: { color: 'var(--cl-text-secondary)', fontWeight: 500, fontSize: 13 },
              input: {
                backgroundColor: 'var(--cl-bg)',
                borderColor: 'var(--cl-border)',
                color: 'var(--cl-text-primary)',
              },
            }}
          />

          {/* Email (read-only) */}
          <TextInput
            label="Email address"
            value={user?.email ?? ''}
            readOnly
            style={{ marginBottom: 20 }}
            styles={{
              label: { color: 'var(--cl-text-secondary)', fontWeight: 500, fontSize: 13 },
              input: {
                backgroundColor: 'var(--cl-bg-subtle)',
                borderColor: 'var(--cl-border)',
                color: 'var(--cl-text-muted)',
                cursor: 'default',
              },
            }}
          />

          <Divider color="var(--cl-border)" style={{ marginBottom: 16 }} />

          <Button
            variant="filled"
            onClick={handleSaveProfile}
            style={{
              backgroundColor: 'var(--cl-brand)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 10,
            }}
          >
            Save changes
          </Button>
        </Box>

        {/* ── Section 2: Password & Security ──────────────────────────────── */}
        <Box
          style={{
            backgroundColor: 'var(--cl-surface)',
            border: '1px solid var(--cl-border)',
            borderRadius: 20,
            padding: 28,
          }}
        >
          <Text fw={600} size="md" style={{ color: 'var(--cl-text-primary)', marginBottom: 20 }}>
            Password &amp; Security
          </Text>

          <PasswordInput
            label="Current password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.currentTarget.value)}
            style={{ marginBottom: 14 }}
            styles={{
              label: { color: 'var(--cl-text-secondary)', fontWeight: 500, fontSize: 13 },
              input: { backgroundColor: 'var(--cl-bg)', borderColor: 'var(--cl-border)', color: 'var(--cl-text-primary)' },
            }}
          />

          <PasswordInput
            label="New password"
            value={newPw}
            onChange={(e) => setNewPw(e.currentTarget.value)}
            error={newPwSameCurrent ? 'New password must differ from current password' : undefined}
            style={{ marginBottom: 4 }}
            styles={{
              label: { color: 'var(--cl-text-secondary)', fontWeight: 500, fontSize: 13 },
              input: { backgroundColor: 'var(--cl-bg)', borderColor: 'var(--cl-border)', color: 'var(--cl-text-primary)' },
            }}
          />

          <PasswordStrengthBar password={newPw} />

          <PasswordInput
            label="Confirm new password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.currentTarget.value)}
            error={newPwMismatch ? 'Passwords do not match' : undefined}
            style={{ marginTop: 14, marginBottom: 20 }}
            styles={{
              label: { color: 'var(--cl-text-secondary)', fontWeight: 500, fontSize: 13 },
              input: { backgroundColor: 'var(--cl-bg)', borderColor: 'var(--cl-border)', color: 'var(--cl-text-primary)' },
            }}
          />

          <Divider color="var(--cl-border)" style={{ marginBottom: 16 }} />

          <Button
            variant="filled"
            onClick={handleUpdatePassword}
            style={{
              backgroundColor: 'var(--cl-brand)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 10,
            }}
          >
            Update password
          </Button>
        </Box>

        {/* ── Section 3: Danger zone ───────────────────────────────────────── */}
        <Box
          style={{
            backgroundColor: 'var(--cl-surface)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 20,
            padding: 24,
          }}
        >
          <Text fw={600} size="md" style={{ color: 'var(--cl-error)', marginBottom: 16 }}>
            Danger zone
          </Text>

          <Group justify="space-between" align="center" wrap="nowrap">
            <Box>
              <Text fw={500} size="sm" style={{ color: 'var(--cl-text-primary)' }}>
                Delete account
              </Text>
              <Text size="xs" style={{ color: 'var(--cl-text-muted)', marginTop: 2 }}>
                Permanently delete your account and all associated data.
              </Text>
            </Box>
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              style={{
                color: 'var(--cl-error)',
                borderColor: 'rgba(239,68,68,0.5)',
                borderRadius: 10,
                flexShrink: 0,
              }}
            >
              Delete account
            </Button>
          </Group>
        </Box>

      </Stack>
    </Box>
  );
}
