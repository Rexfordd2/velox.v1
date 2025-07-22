import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { exerciseSchema, Exercise } from '@/lib/validations/exercise';
import { createExercise, updateExercise } from '@/lib/hooks/useExercises';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { generateSlug } from '@/lib/utils/slug';
import { useSWRConfig } from 'swr';
import useSWR from 'swr';

// TODO: Replace with real data fetching
const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];
const PRIMARY_MUSCLES = [
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'calves'
];
const SECONDARY_MUSCLES = [
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'calves'
];

export function ExerciseFormModal({ isOpen, onClose, exercise, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onSuccess: () => void;
}) {
  const isEdit = !!exercise;
  const { mutate } = useSWRConfig();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const { data: categoriesData, error: categoriesError } = useSWR('/api/exercise-categories', async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    return data.categories;
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<any>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: exercise || {
      name: '',
      slug: '',
      description: '',
      difficulty: 'beginner',
      primary_muscle: '',
      secondary_muscles: [],
      category_ids: [],
      video_demo_url: '',
      equipment: [],
      instructions: ['']
    }
  });

  // Slug auto-generation
  const name = watch('name');
  const slug = watch('slug');
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setValue('slug', generateSlug(name));
    }
    // eslint-disable-next-line
  }, [name]);

  // If user edits slug manually, stop auto-generation
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setValue('slug', e.target.value);
  };

  useEffect(() => {
    if (!isOpen) {
      setSlugManuallyEdited(false);
    }
  }, [isOpen]);

  const onSubmit = async (values: any) => {
    try {
      if (isEdit) {
        await updateExercise(exercise!.slug, values);
        toast.success('Exercise updated');
      } else {
        await createExercise(values);
        toast.success('Exercise created');
      }
      mutate('/api/exercises');
      onSuccess();
    } catch (err: any) {
      if (err.message?.includes('duplicate key value') && err.message?.includes('slug')) {
        toast.error('Slug already exists. Please choose a different one.');
      } else {
        toast.error(err.message || 'Something went wrong');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogTitle>{isEdit ? 'Edit Exercise' : 'New Exercise'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label>Name</label>
            <input {...register('name')} className="input" />
            {errors.name && <span className="text-red-500">{errors.name.message}</span>}
          </div>
          <div>
            <label>Slug</label>
            <input {...register('slug')} className="input" onChange={handleSlugChange} />
            {errors.slug && <span className="text-red-500">{errors.slug.message}</span>}
          </div>
          <div>
            <label>Description (Markdown)</label>
            <textarea {...register('description')} className="input min-h-[80px]" />
            {errors.description && <span className="text-red-500">{errors.description.message}</span>}
          </div>
          <div>
            <label>Difficulty</label>
            <select {...register('difficulty')} className="input">
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            {errors.difficulty && <span className="text-red-500">{errors.difficulty.message}</span>}
          </div>
          <div>
            <label>Primary Muscle</label>
            <select {...register('primary_muscle')} className="input">
              <option value="">Select...</option>
              {PRIMARY_MUSCLES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.primary_muscle && <span className="text-red-500">{errors.primary_muscle.message}</span>}
          </div>
          <div>
            <label>Secondary Muscles</label>
            <Controller
              control={control}
              name="secondary_muscles"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {SECONDARY_MUSCLES.map((m) => (
                    <label key={m} className="chip">
                      <input
                        type="checkbox"
                        checked={field.value?.includes(m)}
                        onChange={() => {
                          if (field.value?.includes(m)) {
                            field.onChange(field.value.filter((v: string) => v !== m));
                          } else {
                            field.onChange([...(field.value || []), m]);
                          }
                        }}
                      />
                      {m}
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.secondary_muscles && <span className="text-red-500">{errors.secondary_muscles.message}</span>}
          </div>
          <div>
            <label>Categories</label>
            <Controller
              control={control}
              name="category_ids"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {categoriesError ? (
                    <div className="text-red-500">Failed to load categories</div>
                  ) : !categoriesData ? (
                    <div className="text-gray-500">Loading categories...</div>
                  ) : categoriesData.length === 0 ? (
                    <div className="text-gray-500">No categories found</div>
                  ) : (
                    categoriesData.map((cat: { id: number; name: string }) => (
                      <label key={cat.id} className="chip">
                        <input
                          type="checkbox"
                          checked={field.value?.includes(cat.id)}
                          onChange={() => {
                            if (field.value?.includes(cat.id)) {
                              field.onChange(field.value.filter((v: number) => v !== cat.id));
                            } else {
                              field.onChange([...(field.value || []), cat.id]);
                            }
                          }}
                        />
                        {cat.name}
                      </label>
                    ))
                  )}
                </div>
              )}
            />
            {errors.category_ids && <span className="text-red-500">{errors.category_ids.message}</span>}
          </div>
          <div>
            <label>Video Demo URL</label>
            <input {...register('video_demo_url')} className="input" />
            {errors.video_demo_url && <span className="text-red-500">{errors.video_demo_url.message}</span>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isEdit ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 