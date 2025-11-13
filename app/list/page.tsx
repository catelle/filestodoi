'use client';

import { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import styles from './list.module.css';
import Link from 'next/link';

interface UploadedFile {
  name: string;
  doi: string;
}

const ListPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    // Retrieve files from localStorage on component mount
    const storedFiles = localStorage.getItem('uploadedFiles');
    if (storedFiles) {
      try {
        setUploadedFiles(JSON.parse(storedFiles));
      } catch (e) {
        console.error("Could not parse files from localStorage", e);
      }
    }
  }, []);

  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    documentTitle: "Fichiers téléversés et DOI",
  });

  const handlePrintClick = () => {
    // Based on the error "Expected 0-1 arguments", we will pass the content
    // as the single argument to the `handlePrint` function.
    handlePrint(() => componentRef.current);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div ref={componentRef} className={styles.printableArea}>
          <h1 className={styles.title}>Fichiers téléversés</h1>
          <p className={styles.description}>
            Voici la liste de vos fichiers téléversés et de leurs DOI correspondants.
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nom du fichier</th>
                <th>DOI Zenodo</th>
              </tr>
            </thead>
            <tbody>
              {uploadedFiles.map((file, index) => (
                <tr key={index}>
                  <td>{file.name}</td>
                  <td>
                    <a
                      href={`https://doi.org/${file.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {`https://doi.org/${file.doi}`}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.buttonContainer}>
          <button onClick={handlePrintClick} className={styles.button}>
            Imprimer la liste en PDF
          </button>
          <Link href="/" passHref>
            <button className={`${styles.button} ${styles.navButton}`}>Aller à la page de téléversement</button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ListPage;