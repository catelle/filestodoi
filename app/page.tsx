'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  };

  const handleClearFiles = () => {
    setFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (files.length === 0) {
      setError('Veuillez sélectionner des fichiers à téléverser.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    for (const file of files) {
      formData.append('file', file);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const existingFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
        const updatedFiles = [...existingFiles, ...data.files];
        localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
        router.push('/list');
      } else {
        setError(data.message || 'Une erreur inconnue est survenue.');
      }
    } catch (err) {
      console.error('Une erreur est survenue lors du téléversement:', err);
      setError('Une erreur est survenue lors du téléversement. Veuillez consulter la console.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.contentWrapper}>
        <div className={styles.leftColumn}>
          <h1 className={styles.title}>Bienvenue sur File-to-DOI</h1>
          <p className={styles.description}>
            Téléversez facilement vos fichiers sur Zenodo et recevez un identifiant d'objet numérique (DOI) persistant pour chacun.
          </p>

          <div className={styles.buttonContainer}>
            <Link href="/list" passHref>
              <button className={`${styles.button} ${styles.navButton}`}>Voir les fichiers téléversés</button>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label htmlFor="file-upload" className={styles.fileUploadLabel}>
              Choisir des fichiers
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              className={styles.fileInput}
            />

            <button type="submit" className={styles.button} disabled={uploading || files.length === 0}>
              {uploading ? 'Téléversement en cours...' : 'Téléverser et générer les DOI'}
            </button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.rightColumn}>
          {files.length > 0 ? (
            <div className={styles.fileListContainer}>
              <div className={styles.fileListHeader}>
                <h2 className={styles.fileListTitle}>Fichiers sélectionnés</h2>
                <button onClick={handleClearFiles} className={styles.clearButton}>
                  Tout effacer
                </button>
              </div>
              <ul className={styles.fileList}>
                {files.map((file, index) => (
                  <li key={index} className={styles.fileListItem}>
                    <span>{file.name}</span>
                    <button onClick={() => handleRemoveFile(file)} className={styles.removeButton}>
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className={styles.fileListContainer}>
                <h2 className={styles.fileListTitle}>Aucun fichier sélectionné</h2>
                <p>Vos fichiers sélectionnés apparaîtront ici.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}