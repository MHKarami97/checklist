import { CLOUD_CONFIG } from './cloudConfig'
import { CloudBackupCodec } from './CloudBackupCodec'
import { CloudKeyVault } from './CloudKeyVault'
import { CloudSyncService } from './CloudSyncService'
import { CloudSyncStateStorage } from './CloudSyncStateStorage'
import { DriveAppDataClient } from './DriveAppDataClient'
import { GoogleAuthService } from './GoogleAuthService'
import { GoogleIdentityLoader } from './GoogleIdentityLoader'

var vault = new CloudKeyVault()
var auth = new GoogleAuthService(
  CLOUD_CONFIG.googleClientId,
  CLOUD_CONFIG.scope,
  new GoogleIdentityLoader()
)

export var cloudSyncService = new CloudSyncService({
  auth,
  drive: new DriveAppDataClient(auth, CLOUD_CONFIG.backupFilePrefix),
  codec: new CloudBackupCodec(vault),
  vault,
  storage: new CloudSyncStateStorage()
})
