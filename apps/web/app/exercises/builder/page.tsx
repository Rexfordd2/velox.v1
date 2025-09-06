'use client';

import { useMemo, useState } from 'react';
import { trpc } from '@/app/_trpc/client';
import { useToast } from '@/components/ui/use-toast';
import type { ExerciseDefinition, PoseCriterion } from '@velox/core';
import { validateExercise } from '@velox/core';

type PhaseDraft = ExerciseDefinition['phases'][number];

const emptyCriterion: PoseCriterion = {};

export default function ExerciseBuilderPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseDefinition['category']>('other');
  const [version, setVersion] = useState(1);
  const [phases, setPhases] = useState<PhaseDraft[]>([
    { name: 'Phase 1', criteria: [emptyCriterion], transitionOn: 'time' },
  ]);
  const [scoring, setScoring] = useState<ExerciseDefinition['scoring']>({ passThreshold: 0.7, severityBands: [0.2, 0.5, 0.8] });

  const def: ExerciseDefinition = useMemo(() => ({ name, category, phases, scoring, version }), [name, category, phases, scoring, version]);
  const validation = useMemo(() => validateExercise(def), [def]);

  const utils = trpc.useUtils();
  const listMine = trpc.customExercises.listMine.useQuery();
  const createMutation = trpc.customExercises.create.useMutation({
    onSuccess: () => {
      utils.customExercises.listMine.invalidate();
      toast({ title: 'Exercise saved' });
    },
    onError: (e) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });
  const updateMutation = trpc.customExercises.update.useMutation({
    onMutate: async (variables) => {
      await utils.customExercises.listMine.cancel();
      const prev = utils.customExercises.listMine.getData();
      utils.customExercises.listMine.setData(undefined, (data) => {
        if (!data) return data;
        const v: any = variables as any;
        if (!v?.id || !v?.definition) return data;
        return data.map((ex) => (ex.id === v.id ? { ...ex, name: v.definition.name, category: v.definition.category } : ex));
      });
      return { prev };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.prev) utils.customExercises.listMine.setData(undefined, ctx.prev);
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    },
    onSettled: () => utils.customExercises.listMine.invalidate(),
    onSuccess: () => toast({ title: 'Exercise updated' }),
  });
  const deleteMutation = trpc.customExercises.delete.useMutation({
    onMutate: async (variables) => {
      await utils.customExercises.listMine.cancel();
      const prev = utils.customExercises.listMine.getData();
      utils.customExercises.listMine.setData(undefined, (data) => {
        const v: any = variables as any;
        if (!data || !v?.id) return data;
        return data.filter((ex) => ex.id !== v.id);
      });
      return { prev };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.prev) utils.customExercises.listMine.setData(undefined, ctx.prev);
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    },
    onSettled: () => utils.customExercises.listMine.invalidate(),
    onSuccess: () => toast({ title: 'Exercise deleted' }),
  });

  const addPhase = () => setPhases((p) => [...p, { name: `Phase ${p.length + 1}`, criteria: [emptyCriterion], transitionOn: 'time' }]);
  const removePhase = (idx: number) => setPhases((p) => p.filter((_, i) => i !== idx));
  const addCriterion = (pIdx: number) => setPhases((p) => p.map((ph, i) => i === pIdx ? { ...ph, criteria: [...ph.criteria, {}] } : ph));
  const removeCriterion = (pIdx: number, cIdx: number) => setPhases((p) => p.map((ph, i) => i === pIdx ? { ...ph, criteria: ph.criteria.filter((_, j) => j !== cIdx) } : ph));

  const onSave = async () => {
    if (!validation.ok) return;
    await createMutation.mutateAsync(def);
  };

  const [editId, setEditId] = useState<string | null>(null);
  const startEdit = (id: string) => {
    setEditId(id);
  };
  const onUpdate = async () => {
    if (!validation.ok || !editId) return;
    await updateMutation.mutateAsync({ id: editId, definition: def });
    setEditId(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Custom Exercise Builder</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="e.g., My Split Squat" />
          </div>
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="mt-1 w-full border rounded px-3 py-2">
              {['lower','upper','core','olympic','other'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Version</label>
            <input type="number" min={1} value={version} onChange={(e) => setVersion(parseInt(e.target.value || '1', 10))} className="mt-1 w-full border rounded px-3 py-2" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Phases</h2>
              <button onClick={addPhase} className="text-sm px-2 py-1 border rounded">Add phase</button>
            </div>

            {phases.map((phase, pIdx) => (
              <div key={pIdx} className="border rounded p-3 space-y-3">
                <div className="flex gap-2">
                  <input value={phase.name} onChange={(e) => setPhases((prev) => prev.map((ph, i) => i === pIdx ? { ...ph, name: e.target.value } : ph))} className="flex-1 border rounded px-3 py-2" />
                  <select value={phase.transitionOn} onChange={(e) => setPhases((prev) => prev.map((ph, i) => i === pIdx ? { ...ph, transitionOn: e.target.value as any } : ph))} className="border rounded px-3 py-2">
                    {['angle','velocity','time','landmark'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => removePhase(pIdx)} className="px-2 py-1 border rounded">Remove</button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Criteria</div>
                    <button onClick={() => addCriterion(pIdx)} className="text-sm px-2 py-1 border rounded">Add criterion</button>
                  </div>
                  {phase.criteria.map((criterion, cIdx) => (
                    <div key={cIdx} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input placeholder="Angle joint (e.g., knee)" className="border rounded px-3 py-2" value={criterion.angle?.joint ?? ''} onChange={(e) => setPhases((prev) => prev.map((ph, i) => i === pIdx ? { ...ph, criteria: ph.criteria.map((cr, j) => j === cIdx ? { ...cr, angle: { ...(cr.angle ?? { }), joint: e.target.value } } : cr) } : ph))} />
                      <input type="number" placeholder="Angle min" className="border rounded px-3 py-2" value={criterion.angle?.min ?? ''} onChange={(e) => setPhases((prev) => prev.map((ph, i) => i === pIdx ? { ...ph, criteria: ph.criteria.map((cr, j) => j === cIdx ? { ...cr, angle: { ...(cr.angle ?? { joint: '' }), min: e.target.value === '' ? undefined : Number(e.target.value) } } : cr) } : ph))} />
                      <input type="number" placeholder="Angle max" className="border rounded px-3 py-2" value={criterion.angle?.max ?? ''} onChange={(e) => setPhases((prev) => prev.map((ph, i) => i === pIdx ? { ...ph, criteria: ph.criteria.map((cr, j) => j === cIdx ? { ...cr, angle: { ...(cr.angle ?? { joint: '' }), max: e.target.value === '' ? undefined : Number(e.target.value) } } : cr) } : ph))} />
                      <div className="md:col-span-3 flex justify-between">
                        <button onClick={() => removeCriterion(pIdx, cIdx)} className="text-xs px-2 py-1 border rounded">Remove criterion</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Scoring</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input type="number" min={0} max={1} step={0.05} value={scoring.passThreshold} onChange={(e) => setScoring((s) => ({ ...s, passThreshold: Number(e.target.value) }))} className="border rounded px-3 py-2" />
              <input placeholder="Severity bands (comma sep)" value={scoring.severityBands.join(',')} onChange={(e) => setScoring((s) => ({ ...s, severityBands: e.target.value.split(',').map((v) => Number(v.trim())).filter((v) => !Number.isNaN(v)) }))} className="border rounded px-3 py-2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">JSON Preview</h2>
              <div className="flex gap-2">
                <button onClick={onSave} disabled={!validation.ok || createMutation.isPending} className="px-3 py-2 border rounded disabled:opacity-50">Save</button>
                {editId && (
                  <button onClick={onUpdate} disabled={!validation.ok || updateMutation.isPending} className="px-3 py-2 border rounded disabled:opacity-50">Update</button>
                )}
              </div>
            </div>
            <pre className="mt-2 text-xs bg-gray-50 border rounded p-3 overflow-auto max-h-[400px]">{JSON.stringify(def, null, 2)}</pre>
          </div>

          <div>
            <h2 className="text-lg font-medium">Validation</h2>
            {validation.ok ? (
              <div className="text-green-700">Valid</div>
            ) : (
              <ul className="list-disc pl-6 text-red-700">
                {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-lg font-medium">My Custom Exercises</h2>
            <div className="space-y-2 mt-2">
              {listMine.data?.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between border rounded p-2">
                  <div className="text-sm">
                    <div className="font-medium">{ex.name}</div>
                    <div className="text-gray-500">{ex.category}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(ex.id)} className="text-sm px-2 py-1 border rounded">Edit</button>
                    <button onClick={() => deleteMutation.mutate({ id: ex.id })} className="text-sm px-2 py-1 border rounded">Delete</button>
                  </div>
                </div>
              ))}
              {!listMine.data?.length && (
                <div className="text-sm text-gray-500">No custom exercises yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


