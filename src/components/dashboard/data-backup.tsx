"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Trash2, Upload } from "lucide-react";
import { exportStudyData, importStudyData, resetStudyData } from "@/lib/study/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DataBackup() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    try {
      const blob = new Blob([exportStudyData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch {
      toast.error("Could not create the backup");
    }
  };

  const upload = async (file: File) => {
    try {
      const count = importStudyData(await file.text());
      toast.success(`Backup restored — ${count} items imported`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that file");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & restore</CardTitle>
        <CardDescription>
          Your notes, highlights, bookmarks, streaks, and plan progress are
          saved automatically on this device. Download a backup file to move
          them to another device or keep them safe.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={download}>
          <Download data-icon="inline-start" />
          Export backup
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload data-icon="inline-start" />
          Import backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        <Button variant="destructive" onClick={() => setConfirmReset(true)}>
          <Trash2 data-icon="inline-start" />
          Erase all data
        </Button>
      </CardContent>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erase all study data?</DialogTitle>
            <DialogDescription>
              This permanently deletes every note, highlight, bookmark, plan
              progress, memory level, quiz stat, and your reading streak from
              this device. Export a backup first if you might want them back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetStudyData();
                setConfirmReset(false);
                toast.success("All study data erased");
              }}
            >
              Erase everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
