package main

import (
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: package <source_dir> <output_file>")
		os.Exit(1)
	}

	sourceDir := os.Args[1]
	outputFile := os.Args[2]

	err := createTarGz(sourceDir, outputFile)
	if err != nil {
		fmt.Printf("Error creating bundle: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully created bundle: %s\n", outputFile)
}

func createTarGz(sourceDir, outputFile string) error {
	out, err := os.Create(outputFile)
	if err != nil {
		return err
	}
	defer out.Close()

	gw := gzip.NewWriter(out)
	defer gw.Close()

	tw := tar.NewWriter(gw)
	defer tw.Close()

	return filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		header, err := tar.FileInfoHeader(info, info.Name())
		if err != nil {
			return err
		}

		// Calculate relative path inside the tar
		relPath, err := filepath.Rel(filepath.Dir(sourceDir), path)
		if err != nil {
			return err
		}
		header.Name = filepath.ToSlash(relPath)

		// Set executable bit for linux binary
		if !info.IsDir() && strings.Contains(header.Name, "plugin-linux-amd64") {
			header.Mode = 0755
		} else if info.IsDir() {
			header.Mode = 0755
		} else {
			header.Mode = 0644
		}

		if err := tw.WriteHeader(header); err != nil {
			return err
		}

		if !info.IsDir() {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()
			_, err = io.Copy(tw, file)
			return err
		}

		return nil
	})
}
