import { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createCourse } from '@api/courses';
import { getCareerTracks } from '@api/careerTracks';
import { useDrawer } from '@hooks/useDrawer';
import InputText from '@components/InputText';
import InputSelect from '@components/InputSelect';
import { slugify } from '@utils/helpers';

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'staff', label: 'Staff' },
  { value: 'principal', label: 'Principal' },
];

const Form = () => {
  const { closeDrawer, setIsPending } = useDrawer();
  const queryClient = useQueryClient();

  const { data: careerTracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ['career_tracks'],
    queryFn: getCareerTracks,
  });

  const trackOptions = careerTracks.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const { mutate, isPending } = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      closeDrawer();
    },
  });

  useEffect(() => {
    setIsPending(isPending);
  }, [isPending, setIsPending]);

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      career_track_id: '',
      level: 'beginner',
      position: 0,
    },
    onSubmit: ({ value }) => {
      mutate({ ...value, slug: slugify(value.title) });
    },
  });

  return (
    <div className="space-y-6 pt-6 pb-5">
      <form
        id="study-hub-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="title"
          validators={{
            onChange: ({ value }) =>
              !value
                ? 'Title is required'
                : value.length < 3
                  ? 'Title must be at least 3 characters'
                  : undefined,
          }}
          children={(field) => (
            <div>
              <InputText field={field} label="Title:" autoComplete="off" />
            </div>
          )}
        />

        <form.Field
          name="career_track_id"
          validators={{
            onChange: ({ value }) =>
              !value ? 'Career track is required' : undefined,
          }}
          children={(field) => (
            <div className="mt-4">
              <InputSelect
                field={field}
                label="Career Track:"
                options={trackOptions}
                placeholder={tracksLoading ? 'Loading...' : 'Select a track'}
              />
            </div>
          )}
        />

        <form.Field
          name="level"
          validators={{
            onChange: ({ value }) => (!value ? 'Level is required' : undefined),
          }}
          children={(field) => (
            <div className="mt-4">
              <InputSelect
                field={field}
                label="Level:"
                options={LEVEL_OPTIONS}
              />
            </div>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <div className="mt-4">
              <InputText field={field} label="Description:" as="textarea" />
            </div>
          )}
        />
      </form>
    </div>
  );
};

export default Form;
