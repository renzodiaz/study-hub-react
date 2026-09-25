import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { updateProfile } from '@api/auth';
import { useAuth } from '@hooks/useAuth';
import { Button, Banner, Card, Field } from '@components/ui';

const avatarSrc = (avatarUrl, firstName, lastName) =>
  avatarUrl ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    `${firstName} ${lastName}`,
  )}&background=0D4A54&color=fff`;

// Binds a TanStack Form field to the design-system Field primitive so the form
// gets the DS control styling and accessibility (label, aria-describedby error,
// icon+text error) without duplicating markup.
const ProfileField = ({ field, label, type = 'text', autoComplete, rows }) => {
  const { meta } = field.state;
  const showError = meta.isTouched && meta.errors.length > 0;
  return (
    <Field
      id={field.name}
      label={label}
      type={type}
      rows={rows}
      autoComplete={autoComplete}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      error={showError ? meta.errors.join(', ') : undefined}
    />
  );
};

const Settings = () => {
  const { user, setLoggedIn } = useAuth();
  const [saved, setSaved] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      setLoggedIn(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const form = useForm({
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      avatar_url: user?.avatar_url ?? '',
      bio: user?.bio ?? '',
    },
    onSubmit: ({ value }) =>
      mutate({ ...value, avatar_url: value.avatar_url || null }),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-title font-semibold tracking-tight text-ink">
        Settings
      </h1>

      {error && (
        <Banner variant="danger" className="mt-6">
          {error.message}
        </Banner>
      )}
      {saved && (
        <Banner variant="success" className="mt-6">
          Profile updated successfully.
        </Banner>
      )}

      <Card
        as="section"
        aria-labelledby="profile-heading"
        className="mt-6 overflow-hidden"
      >
        <div className="flex items-center gap-5 border-b border-line px-6 py-6">
          <form.Subscribe
            selector={(state) => ({
              avatar_url: state.values.avatar_url,
              first_name: state.values.first_name,
              last_name: state.values.last_name,
            })}
            children={({ avatar_url, first_name, last_name }) => (
              <img
                src={avatarSrc(avatar_url, first_name, last_name)}
                alt=""
                className="size-16 rounded-full object-cover"
              />
            )}
          />
          <div className="min-w-0">
            <p
              id="profile-heading"
              className="text-card font-semibold text-ink"
            >
              {user?.first_name} {user?.last_name}
            </p>
            <p className="truncate text-body-sm text-ink-muted">
              {user?.email}
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="flex flex-col gap-5 px-6 py-6">
            <p className="text-eyebrow font-semibold uppercase tracking-wide text-ink-muted">
              Your details
            </p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <form.Field
                name="first_name"
                validators={{
                  onChange: ({ value }) =>
                    !value ? 'First name is required' : undefined,
                }}
                children={(field) => (
                  <ProfileField
                    field={field}
                    label="First name"
                    autoComplete="given-name"
                  />
                )}
              />
              <form.Field
                name="last_name"
                validators={{
                  onChange: ({ value }) =>
                    !value ? 'Last name is required' : undefined,
                }}
                children={(field) => (
                  <ProfileField
                    field={field}
                    label="Last name"
                    autoComplete="family-name"
                  />
                )}
              />
            </div>

            {/* Email is read-only: changing it is not implemented (no fake control). */}
            <div className="flex flex-col gap-1">
              <span className="text-body font-medium text-ink">Email</span>
              <div className="rounded-control border border-line bg-surface-sunken px-3 py-2 text-body text-ink-muted">
                {user?.email}
              </div>
              <p className="text-body-sm text-ink-muted">
                Email can’t be changed here.
              </p>
            </div>

            <form.Field
              name="avatar_url"
              children={(field) => (
                <ProfileField
                  field={field}
                  label="Avatar URL"
                  autoComplete="off"
                />
              )}
            />

            <form.Field
              name="bio"
              children={(field) => (
                <ProfileField
                  field={field}
                  label="Bio"
                  type="textarea"
                  rows={4}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-line px-6 py-4">
            <span className="text-body-sm text-ink-muted">
              Nothing is saved until you press Save.
            </span>
            <Button type="submit" busy={isPending} busyLabel="Saving…">
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      <Card
        as="section"
        className="mt-5 flex flex-wrap items-center justify-between gap-3 p-6"
      >
        <div>
          <p className="text-body font-semibold text-ink">Subscription</p>
          <p className="mt-0.5 text-body-sm text-ink-secondary">
            View your plan and manage billing.
          </p>
        </div>
        <Link
          to="/billing"
          className="inline-flex h-10 items-center justify-center rounded-control border border-line-strong bg-surface px-4 text-body font-semibold text-ink hover:bg-primary-wash"
        >
          Go to billing
        </Link>
      </Card>
    </div>
  );
};

export default Settings;
