importantFiles = ["/boot/System.map","/boot/initrd.img","/boot/kernel.img","/etc/xorg.conf","/etc/fstab","/sys/xorg.sys","/sys/network.sys","/sys/config.sys","/lib/init.so","/lib/net.so","/lib/kernel_module.so","/lib/aptclient.so","/bin/ssh","/bin/chmod","/bin/useradd","/bin/reboot","/bin/sudo","/bin/rm","/bin/apt-get","/usr/bin/Terminal.exe","/usr/bin/Browser.exe","/usr/bin/FileExplorer.exe"]


UsageMessage = function()
	c="\n"
	l1="-h | --help = Program usage"
	l2="-b | --backup = Backup essential files for full recovery"
	l3="-r | --restore = Restore all missing files"
	return "[Recovery Menu]"+c+c+l1+c+l2+c+l3
end function

IsRoot = function(comp)
	k=comp.File("/boot/kernel.img")
	if not k then return 1
	return k.has_permission("w")
end function

if params.len == 0 or params.len > 1 then exit(UsageMessage)

action = params[0]

shell = get_shell
comp = shell.host_computer

if not IsRoot(comp) then exit("Error: root access needed!")

if action == "-h" or action == "--help" then exit(UsageMessage)

if action == "-r" or action == "--recover" then
	user_input("Press enter to start.")
	
	backup = comp.File("/.rec")
	if not backup then exit("Error: No backup found!")
	
	recover = function(file)
		fPath = file.path.remove("/.rec")
		fPPath = file.parent.path.remove("/.rec")
		if comp.File(fPath) then return null
		
		if not comp.File("/"+file.parent.parent.name) then
			comp.create_folder("/",file.parent.parent.name)
		end if
			
		if not comp.File("/"+file.parent.parent.name+"/"+file.parent.name) then
			comp.create_folder("/"+file.parent.parent.name,file.parent.name)
		end if
		
		if not comp.File("/"+file.parent.name) then
			comp.create_folder("/",file.parent.name)
		end if
		
		print("Recovering: "+fPath)
		file.copy(fPPath,file.name)
	end function
	
	recoverLoop = function(fo)
		for f in fo.get_folders
			recoverLoop(f)
		end for
	
		for f in fo.get_files
			recover(f)
		end for
	end function

	recoverLoop(backup)
	
	exit("Successfully recovered! Chmod the files and run reboot.'")
end if

if action == "-b" or action == "--backup" then
	user_input("Press enter to start.")
	
	rec = comp.File("/.rec")
	if rec then
		print("Deleting previous backup...")
		rec.delete()
	end if

	comp.create_folder("/",".rec")
	rec = comp.File("/.rec")
	
	for file in importantFiles
		file = comp.File(file)
		if file then
			print("Backing up: "+file.path)
	
			if not comp.File("/.rec/"+file.parent.parent.name) then
				comp.create_folder("/.rec",file.parent.parent.name)
			end if
			
			if not comp.File("/.rec/"+file.parent.parent.name+"/"+file.parent.name) then
				comp.create_folder("/.rec/"+file.parent.parent.name,file.parent.name)
			end if
		
			if not comp.File("/.rec/"+file.parent.name) then
				comp.create_folder("/.rec",file.parent.name)
			end if
					
			if comp.File("/.rec"+file.parent.path+"/"+file.name) then
				comp.File("/.rec"+file.parent.path+"/"+file.name).delete
			end if 
			
			file.copy("/.rec"+file.parent.path,file.name)
		end if
	end for
	
	print("Making program copy...")
	comp.File(program_path).copy("/.rec","recover")
	
	rec.chmod("u-wrx", 1)
	rec.chmod("g-wrx", 1)
	rec.chmod("o-wrx", 1)
	
	rec.set_owner("root", 1)
	rec.set_group("root", 1)
	
	exit("Successfully backed up! Run '/.rec/recover -r' to recover.")
end if

exit("Error: invalid action.")
