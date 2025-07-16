# Asset Management & Backup Guide

## Overview
This guide covers how to manage and backup large assets (3D models, textures, audio, etc.) for your metaverse project.

## Asset Directory Structure
```
assets/
├── models/          # 3D models (.glb, .gltf, .obj, .fbx)
├── textures/        # Textures (.png, .jpg, .hdr, .ktx)
├── audio/           # Audio files (.mp3, .wav, .ogg)
├── animations/      # Animation files (.fbx, .bvh)
└── environments/    # Environment maps, skyboxes
```

## Asset Backup Strategy

### 1. **Local Backups**
- **Location**: `./backups/`
- **Format**: `.tar.gz` and `.zip`
- **Retention**: Last 10 backups kept automatically
- **Run**: `./backup-assets.sh`

### 2. **Cloud Backups**
The backup script automatically copies to:
- **Google Drive**: `~/Google Drive/Backups/`
- **Dropbox**: `~/Dropbox/Backups/`
- **iCloud**: `~/Library/Mobile Documents/com~apple~CloudDocs/Backups/`

### 3. **Asset Inventory**
- **Location**: `./backups/asset_inventory_YYYYMMDD_HHMMSS.txt`
- **Contains**: File list, sizes, modification dates
- **Generated**: Automatically with each backup

## Best Practices

### File Organization
1. **Use descriptive names**: `player_character_v2.glb` not `model1.glb`
2. **Version your assets**: `texture_v1.png`, `texture_v2.png`
3. **Group related files**: `character/` folder with model, textures, animations
4. **Keep file sizes reasonable**: Compress textures, optimize models

### Asset Types & Recommendations

#### 3D Models
- **Preferred**: `.glb` (binary, single file, efficient)
- **Alternative**: `.gltf` (text-based, human readable)
- **Max size**: 10MB per model for web
- **Optimization**: Use Draco compression

#### Textures
- **Formats**: `.png` (lossless), `.jpg` (lossy), `.ktx` (compressed)
- **Sizes**: Power of 2 (256x256, 512x512, 1024x1024)
- **Max size**: 2MB per texture
- **Compression**: Use texture compression tools

#### Audio
- **Formats**: `.mp3` (compressed), `.wav` (uncompressed)
- **Max size**: 5MB per audio file
- **Quality**: 128kbps for music, 64kbps for effects

## Backup Commands

### Manual Backup
```bash
# Run asset backup
./backup-assets.sh

# Check backup status
ls -la backups/

# View asset inventory
cat backups/asset_inventory_*.txt | tail -20
```

### Automated Backup (Cron)
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/your/project && ./backup-assets.sh >> backup.log 2>&1
```

## Asset Loading in Code

### Current Implementation
Your project currently uses:
- External textures: `https://playground.babylonjs.com/textures/flare.png`
- Dynamic textures: Generated in code
- Basic geometries: Created programmatically

### Future Asset Loading
When you add local assets:

```typescript
// Load 3D model
BABYLON.SceneLoader.ImportMesh("", "./assets/models/", "character.glb", scene);

// Load texture
const texture = new BABYLON.Texture("./assets/textures/ground.png", scene);

// Load audio
const sound = new BABYLON.Sound("music", "./assets/audio/background.mp3", scene);
```

## Asset Optimization

### Before Adding to Project
1. **Compress textures**: Use tools like TinyPNG, ImageOptim
2. **Optimize 3D models**: Reduce polygon count, remove unused materials
3. **Compress audio**: Convert to appropriate format and bitrate
4. **Test loading times**: Ensure assets load quickly in browser

### Performance Monitoring
- Monitor asset loading times
- Check bundle size impact
- Use browser dev tools to profile memory usage
- Consider lazy loading for large assets

## Recovery Procedures

### Restore from Backup
```bash
# Extract backup
tar -xzf backups/metaverse-project_assets_20241201_143022.tar.gz

# Or use zip
unzip backups/metaverse-project_assets_20241201_143022.zip
```

### Verify Assets
```bash
# Check file integrity
find assets/ -type f -exec md5sum {} \; > asset_checksums.txt

# Compare with backup
diff asset_checksums.txt backups/asset_checksums_20241201_143022.txt
```

## Troubleshooting

### Common Issues
1. **Large file sizes**: Compress or optimize assets
2. **Missing assets**: Check file paths and permissions
3. **Loading errors**: Verify file formats and corruption
4. **Performance issues**: Optimize asset quality and size

### Backup Issues
1. **Cloud sync not working**: Check cloud storage setup
2. **Permission errors**: Ensure write access to backup directories
3. **Disk space**: Monitor available storage
4. **Network issues**: Check internet connection for cloud backups

## Security Considerations

### Asset Protection
- **Backup encryption**: Consider encrypting sensitive assets
- **Access control**: Limit who can access asset backups
- **Version control**: Keep multiple versions of important assets
- **Offsite backup**: Ensure backups are stored in different locations

### Asset Licensing
- **Track licenses**: Keep records of asset licenses and usage rights
- **Respect copyright**: Only use assets you have rights to
- **Document sources**: Record where assets came from
- **License expiration**: Monitor when licenses need renewal

## Integration with Git

### Git LFS (Large File Storage)
For version control of large assets:
```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.glb"
git lfs track "*.png"
git lfs track "*.mp3"

# Add .gitattributes
git add .gitattributes
```

### Git Ignore
Add to `.gitignore`:
```
# Backup files
backups/
*.tar.gz
*.zip

# Large assets (if not using Git LFS)
assets/models/*.glb
assets/textures/*.png
assets/audio/*.mp3
```

## Monitoring & Alerts

### Backup Monitoring
- **Automated checks**: Verify backups complete successfully
- **Size monitoring**: Alert if backup size changes significantly
- **Error notifications**: Get notified of backup failures
- **Storage monitoring**: Check available disk space

### Asset Health Checks
- **File integrity**: Regular checksum verification
- **Loading tests**: Automated asset loading tests
- **Performance monitoring**: Track asset loading times
- **Error tracking**: Monitor asset-related errors in production 