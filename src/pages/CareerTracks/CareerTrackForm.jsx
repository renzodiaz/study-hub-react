import { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createCareerTrack, updateCareerTrack } from '@api/careerTracks';
import { useDrawer } from '@hooks/useDrawer';
import { slugify } from '@utils/helpers';
import InputText from '@components/InputText';
import Toggle from '@components/Toggle';

const CareerTrackForm = ({ careerTrack }) => {
  const isEdit = !!careerTrack;
  const { closeDrawer, setIsPending } = useDrawer();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: isEdit
      ? (data) => updateCareerTrack(careerTrack.id, data)
      : createCareerTrack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['career_tracks'] });
      closeDrawer();
    },
  });

  useEffect(() => {
    setIsPending(isPending);
  }, [isPending, setIsPending]);

  const form = useForm({
    defaultValues: {
      name: careerTrack?.name ?? '',
      description: careerTrack?.description ?? '',
      icon: careerTrack?.icon ?? '',
      color: careerTrack?.color ?? '#6366f1',
      published: careerTrack?.published ?? false,
      position: careerTrack?.position ?? 0,
    },
    onSubmit: ({ value }) => {
      mutate({ ...value, slug: slugify(value.name) });
    },
  });

  return (
    <div className="space-y-6 pt-6 pb-5">
      <form
        id="career-track-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => (!value ? 'Name is required' : undefined),
          }}
          children={(field) => (
            <InputText field={field} label="Name:" autoComplete="off" />
          )}
        />

        <div className="mt-4">
          <form.Field
            name="description"
            children={(field) => (
              <InputText
                field={field}
                label="Description:"
                as="textarea"
                rows={3}
              />
            )}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4">
          <form.Field
            name="icon"
            children={(field) => (
              <InputText
                field={field}
                label="Icon (emoji):"
                autoComplete="off"
              />
            )}
          />
          <form.Field
            name="position"
            children={(field) => (
              <InputText field={field} label="Position:" type="number" />
            )}
          />
        </div>

        <div className="mt-4">
          <form.Field
            name="color"
            children={(field) => (
              <div>
                <label className="block text-sm/6 font-medium text-gray-900">
                  Color:
                </label>
                <div className="mt-1 flex items-center gap-x-3">
                  <input
                    type="color"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="size-9 shrink-0 cursor-pointer rounded-md border border-gray-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1 rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                  />
                </div>
              </div>
            )}
          />
        </div>

        <div className="mt-4 divide-y divide-gray-100">
          <form.Field
            name="published"
            children={(field) => (
              <Toggle
                label="Published"
                value={field.state.value}
                onChange={field.handleChange}
              />
            )}
          />
        </div>
      </form>
    </div>
  );
};

export default CareerTrackForm;
