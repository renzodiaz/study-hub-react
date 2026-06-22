import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';

import { updateProfile } from '@api/auth';
import { useAuth } from '@hooks/useAuth';
import InputText from '@components/InputText';
import ContentHeading from '@layouts/partials/ContentHeading';

const avatarSrc = (avatarUrl, firstName, lastName) =>
  avatarUrl ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(`${firstName} ${lastName}`)}&background=6366f1&color=fff`;

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
    <>
      <ContentHeading title="Profile Settings" />

      <div className="mx-auto max-w-2xl">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        )}
        {saved && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">
              Profile updated successfully.
            </p>
          </div>
        )}

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          {/* Avatar preview */}
          <div className="flex items-center gap-x-6 border-b border-gray-900/10 px-6 py-8">
            <form.Subscribe
              selector={(state) => ({
                avatar_url: state.values.avatar_url,
                first_name: state.values.first_name,
                last_name: state.values.last_name,
              })}
              children={({ avatar_url, first_name, last_name }) => (
                <img
                  src={avatarSrc(avatar_url, first_name, last_name)}
                  alt="Avatar preview"
                  className="size-20 rounded-full object-cover ring-2 ring-white shadow"
                />
              )}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="px-6 py-8 space-y-6">
              {/* Name row */}
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <form.Field
                  name="first_name"
                  validators={{
                    onChange: ({ value }) => (!value ? 'Required' : undefined),
                  }}
                  children={(field) => (
                    <InputText
                      field={field}
                      label="First name:"
                      autoComplete="given-name"
                    />
                  )}
                />
                <form.Field
                  name="last_name"
                  validators={{
                    onChange: ({ value }) => (!value ? 'Required' : undefined),
                  }}
                  children={(field) => (
                    <InputText
                      field={field}
                      label="Last name:"
                      autoComplete="family-name"
                    />
                  )}
                />
              </div>

              {/* Email — read-only */}
              <div>
                <label className="block text-sm/6 font-medium text-gray-900">
                  Email:
                </label>
                <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500">
                  {user?.email}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Email cannot be changed here.
                </p>
              </div>

              {/* Avatar URL */}
              <form.Field
                name="avatar_url"
                children={(field) => (
                  <InputText
                    field={field}
                    label="Avatar URL:"
                    autoComplete="off"
                  />
                )}
              />

              {/* Bio */}
              <form.Field
                name="bio"
                children={(field) => (
                  <InputText
                    field={field}
                    label="Bio:"
                    as="textarea"
                    rows={4}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-x-4 border-t border-gray-900/10 px-6 py-4">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Settings;
