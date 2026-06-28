package de.lipponer.www.twa;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.documentfile.provider.DocumentFile;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;
import androidx.activity.result.ActivityResult;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;

@CapacitorPlugin(name = "SafStorage")
public class SafStoragePlugin extends Plugin {

    @PluginMethod
    public void chooseFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        startActivityForResult(call, intent, "chooseFolderResult");
    }

    @ActivityCallback
    private void chooseFolderResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Uri treeUri = result.getData().getData();
            if (treeUri != null) {
                try {
                    // Request persistable URI permission
                    final int takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
                    getContext().getContentResolver().takePersistableUriPermission(treeUri, takeFlags);

                    JSObject ret = new JSObject();
                    ret.put("uri", treeUri.toString());
                    call.resolve(ret);
                    return;
                } catch (Exception e) {
                    call.reject("Failed to take persistable URI permission: " + e.getMessage());
                    return;
                }
            }
        }
        call.reject("Folder selection cancelled");
    }

    @PluginMethod
    public void readFile(PluginCall call) {
        String uriStr = call.getString("folderUri");
        String fileName = call.getString("fileName");
        if (uriStr == null || fileName == null) {
            call.reject("Missing parameters");
            return;
        }

        try {
            Uri treeUri = Uri.parse(uriStr);
            DocumentFile treeFile = DocumentFile.fromTreeUri(getContext(), treeUri);
            if (treeFile == null) {
                call.reject("Could not access folder");
                return;
            }

            DocumentFile targetFile = treeFile.findFile(fileName);
            if (targetFile == null || !targetFile.exists()) {
                JSObject ret = new JSObject();
                ret.put("content", "");
                call.resolve(ret);
                return;
            }

            InputStream is = getContext().getContentResolver().openInputStream(targetFile.getUri());
            BufferedReader br = new BufferedReader(new InputStreamReader(is, "UTF-8"));
            StringBuilder sb = new StringBuilder();
            String line;
            boolean first = true;
            while ((line = br.readLine()) != null) {
                if (!first) {
                    sb.append("\n");
                }
                sb.append(line);
                first = false;
            }
            br.close();
            is.close();

            JSObject ret = new JSObject();
            ret.put("content", sb.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read file: " + e.getMessage());
        }
    }

    @PluginMethod
    public void writeFile(PluginCall call) {
        String uriStr = call.getString("folderUri");
        String fileName = call.getString("fileName");
        String content = call.getString("content");
        if (uriStr == null || fileName == null || content == null) {
            call.reject("Missing parameters");
            return;
        }

        try {
            Uri treeUri = Uri.parse(uriStr);
            DocumentFile treeFile = DocumentFile.fromTreeUri(getContext(), treeUri);
            if (treeFile == null) {
                call.reject("Could not access folder");
                return;
            }

            DocumentFile targetFile = treeFile.findFile(fileName);
            if (targetFile == null) {
                targetFile = treeFile.createFile("text/plain", fileName);
            }

            if (targetFile == null) {
                call.reject("Could not create file");
                return;
            }

            OutputStream os = getContext().getContentResolver().openOutputStream(targetFile.getUri(), "rwt");
            os.write(content.getBytes("UTF-8"));
            os.close();

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to write file: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isFolderLinked(PluginCall call) {
        String uriStr = call.getString("folderUri");
        if (uriStr == null) {
            call.resolve(new JSObject().put("linked", false));
            return;
        }

        try {
            Uri treeUri = Uri.parse(uriStr);
            DocumentFile treeFile = DocumentFile.fromTreeUri(getContext(), treeUri);
            boolean linked = treeFile != null && treeFile.exists() && treeFile.canRead() && treeFile.canWrite();
            call.resolve(new JSObject().put("linked", linked));
        } catch (Exception e) {
            call.resolve(new JSObject().put("linked", false));
        }
    }
}
